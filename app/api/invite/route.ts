import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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

    // 2. 요청 바디 파싱
    const { email, building_id, name } = await request.json()

    if (!email || !building_id || !name) {
      return NextResponse.json({ error: '이메일, 건물, 이름은 필수입니다.' }, { status: 400 })
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
    const { data: building } = await supabaseAdmin
      .from('buildings')
      .select('id, name')
      .eq('id', building_id)
      .single()

    if (!building) {
      return NextResponse.json({ error: '존재하지 않는 건물입니다.' }, { status: 404 })
    }

    // 5. 이메일 초대 발송 (초대받은 사용자는 이메일 링크 클릭 후 비밀번호 설정 가능)
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/callback`,
        data: {
          name,
          building_id,
          role: 'owner',
        },
      }
    )

    if (inviteError) {
      // 이미 가입된 사용자인 경우 안내
      if (inviteError.message.includes('already been registered')) {
        return NextResponse.json({ error: '이미 가입된 이메일입니다.' }, { status: 409 })
      }
      return NextResponse.json({ error: `초대 발송 실패: ${inviteError.message}` }, { status: 500 })
    }

    const invitedUserId = inviteData?.user?.id
    if (!invitedUserId) {
      return NextResponse.json({ error: '초대 처리 중 오류가 발생했습니다.' }, { status: 500 })
    }

    // 6. profiles 테이블에 건물주 정보 등록
    // upsert로 중복 방지
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: invitedUserId,
          role: 'owner',
          building_id,
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

    return NextResponse.json({ success: true, message: `${email}로 초대 이메일을 발송했습니다.` })
  } catch (err) {
    console.error('Invite API error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
