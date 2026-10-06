import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// 건물주 목록 + 이메일 + 담당 건물 id 목록을 반환한다.
// profiles 테이블에는 이메일이 없어 auth.users 조회가 필요하므로 service_role key를 쓰는 API 라우트로 분리했다.
export async function GET() {
  try {
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

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const [{ data: owners }, { data: assignments }, { data: userList, error: listError }] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, name').eq('role', 'owner').order('name'),
      supabaseAdmin.from('owner_buildings').select('owner_id, building_id'),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ])

    if (listError) {
      return NextResponse.json({ error: `사용자 조회 실패: ${listError.message}` }, { status: 500 })
    }

    const emailById = new Map(userList.users.map((u) => [u.id, u.email || '']))
    const buildingIdsByOwner = new Map<string, string[]>()
    for (const row of assignments || []) {
      const list = buildingIdsByOwner.get(row.owner_id) || []
      list.push(row.building_id)
      buildingIdsByOwner.set(row.owner_id, list)
    }

    const result = (owners || []).map((o) => ({
      id: o.id,
      name: o.name,
      email: emailById.get(o.id) || '',
      buildingIds: buildingIdsByOwner.get(o.id) || [],
    }))

    return NextResponse.json({ owners: result })
  } catch (err) {
    console.error('Owners API error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
