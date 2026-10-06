import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Supabase Auth 설정 안내:
// Supabase → Authentication → URL Configuration
// - Site URL: https://배포된주소.netlify.app
// - Redirect URLs에 https://배포된주소.netlify.app/auth/callback 추가
// 이 설정을 해야 초대 이메일의 링크가 올바르게 동작합니다.

export async function POST(request: NextRequest) {
  try {
    // 1. 현재 로그인된 사용자가 admin인지 확인
    const serverSupabase = await createServerSupabaseClient()
    const { data: { user } } = await serverSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { data: profile } = await serverSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    // 2. 요청 바디 파싱 (한 명이 여러 건물을 담당할 수 있어 building_ids 배열로 받는다)
    const { email, building_ids, name } = await request.json()

    if (!email || !name || !Array.isArray(building_ids) || building_ids.length === 0) {
      return NextResponse.json({ error: '이메일, 담당 건물(1개 이상), 이름은 필수입니다.' }, { status: 400 })
    }

    // 3. service_role key로 admin client 생성
    // SUPABASE_SERVICE_ROLE_KEY는 절대 클라이언트에 노출하면 안 됩니다 (NEXT_PUBLIC_ 사용 금지)
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 4. 건물 존재 여부 확인
    const { data: buildingsFound } = await supabaseAdmin
      .from('buildings')
      .select('id, name')
      .in('id', building_ids)

    if (!buildingsFound || buildingsFound.length !== building_ids.length) {
      return NextResponse.json({ error: '존재하지 않는 건물이 포함되어 있습니다.' }, { status: 404 })
    }

    // 5. 이메일 초대 발송 (초대받은 사용자는 이메일 링크 클릭 후 비밀번호 설정 가능)
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/callback`,
        data: {
          name,
          building_ids,
          role: 'owner',
        },
      }
    )

    if (inviteError) {
      // 이미 가입된 이메일이면 초대 메일을 다시 보내는 대신, 기존 건물주에게 선택한 건물을 추가 배정한다.
      if (inviteError.message.includes('already been registered')) {
        return await addBuildingsToExistingOwner(supabaseAdmin, email, building_ids)
      }
      return NextResponse.json({ error: `초대 발송 실패: ${inviteError.message}` }, { status: 500 })
    }

    const invitedUserId = inviteData?.user?.id
    if (!invitedUserId) {
      return NextResponse.json({ error: '초대 처리 중 오류가 발생했습니다.' }, { status: 500 })
    }

    // 6. profiles 테이블에 건물주 정보 등록 (building_id는 하위 호환용으로 첫 번째 건물을 넣어둔다)
    // upsert로 중복 방지
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: invitedUserId,
          role: 'owner',
          building_id: building_ids[0],
          name,
        },
        { onConflict: 'id' }
      )

    if (profileError) {
      console.error('Profile insert error:', profileError)
      // 초대는 성공했으나 프로필 등록 실패 — 부분 성공으로 안내
      return NextResponse.json({
        success: true,
        warning: `초대 이메일은 발송됐지만 프로필 등록에 실패했습니다: ${profileError.message}`,
      })
    }

    // 7. owner_buildings에 담당 건물 전체를 등록
    const { error: obError } = await supabaseAdmin
      .from('owner_buildings')
      .upsert(
        building_ids.map((bid: string) => ({ owner_id: invitedUserId, building_id: bid })),
        { onConflict: 'owner_id,building_id' }
      )

    if (obError) {
      console.error('owner_buildings insert error:', obError)
      return NextResponse.json({
        success: true,
        warning: `초대 이메일은 발송됐지만 건물 배정 중 일부 오류가 발생했습니다: ${obError.message}`,
      })
    }

    return NextResponse.json({ success: true, message: `${email}로 초대 이메일을 발송했습니다. (담당 건물 ${building_ids.length}개)` })
  } catch (err) {
    console.error('Invite API error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 이미 가입된 이메일로 다시 초대한 경우: 새 계정을 만드는 대신 기존 건물주에게 선택한 건물을 추가 배정한다.
// (한 명이 여러 건물을 담당하는 시나리오의 핵심 — 두 번째 건물부터는 이 경로를 탄다)
async function addBuildingsToExistingOwner(
  supabaseAdmin: SupabaseClient,
  email: string,
  buildingIds: string[]
) {
  // Auth에는 이메일로 직접 조회하는 API가 없어 목록에서 찾는다 (사용자 수가 적은 내부용 시스템이라 충분하다)
  const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (listError) {
    return NextResponse.json({ error: `사용자 조회 실패: ${listError.message}` }, { status: 500 })
  }

  const existingUser = userList.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  )

  if (!existingUser) {
    return NextResponse.json({ error: '이미 가입된 이메일이지만 사용자 정보를 찾을 수 없습니다.' }, { status: 409 })
  }

  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', existingUser.id)
    .single()

  if (existingProfile && existingProfile.role !== 'owner') {
    return NextResponse.json({ error: '이미 다른 역할(관리자 등)로 가입된 이메일입니다.' }, { status: 409 })
  }

  // 기존에 이미 배정된 건물은 건너뛰고, 새로 선택한 건물만 추가
  const { data: alreadyAssigned } = await supabaseAdmin
    .from('owner_buildings')
    .select('building_id')
    .eq('owner_id', existingUser.id)
    .in('building_id', buildingIds)

  const alreadyAssignedIds = new Set((alreadyAssigned || []).map((r) => r.building_id))
  const newBuildingIds = buildingIds.filter((id) => !alreadyAssignedIds.has(id))

  if (newBuildingIds.length === 0) {
    return NextResponse.json({ error: '선택한 건물은 이미 모두 이 건물주에게 배정되어 있습니다.' }, { status: 409 })
  }

  const { error: obError } = await supabaseAdmin
    .from('owner_buildings')
    .insert(newBuildingIds.map((bid) => ({ owner_id: existingUser.id, building_id: bid })))

  if (obError) {
    return NextResponse.json({ error: `건물 배정 실패: ${obError.message}` }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `이미 가입된 이메일입니다. 새 초대 메일 대신 ${email} 계정에 건물 ${newBuildingIds.length}개를 추가로 배정했습니다.`,
  })
}
