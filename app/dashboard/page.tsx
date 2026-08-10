import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Calendar from '@/components/Calendar'
import { MaintenanceLog } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const isAdmin = profile.role === 'admin'

  // 관리자: 모든 건물 / 건물주: 본인 건물만
  let buildings: { id: string; name: string; address: string | null }[] = []
  if (isAdmin) {
    const { data } = await supabase.from('buildings').select('*').order('name')
    buildings = data || []
  } else if (profile.building_id) {
    const { data } = await supabase.from('buildings').select('*').eq('id', profile.building_id)
    buildings = data || []
  }

  // 이번 달 로그 불러오기 (관리자: 첫 번째 건물, 건물주: 본인 건물)
  const targetBuildingId = isAdmin ? buildings[0]?.id : profile.building_id

  let logs: MaintenanceLog[] = []
  if (targetBuildingId) {
    const now = new Date()
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`

    const { data } = await supabase
      .from('maintenance_logs')
      .select('*')
      .eq('building_id', targetBuildingId)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)

    logs = data || []
  }

  const targetBuilding = buildings.find((b) => b.id === targetBuildingId)

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {isAdmin ? '관리 현황 캘린더' : '관리 이력 조회'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {isAdmin
            ? '건물별 관리 현황을 캘린더로 확인하세요'
            : '본인 건물의 관리 이력을 확인하세요'}
        </p>
      </div>

      {/* 관리자: 건물 탭 */}
      {isAdmin && buildings.length > 1 && (
        <AdminCalendarTabs buildings={buildings} initialLogs={logs} />
      )}

      {/* 단일 건물 캘린더 */}
      {(!isAdmin || buildings.length <= 1) && (
        <Calendar
          logs={logs}
          buildingName={targetBuilding?.name}
        />
      )}

      {/* 건물이 없는 경우 */}
      {buildings.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-slate-500 font-medium">등록된 건물이 없습니다</p>
          <p className="text-slate-400 text-sm mt-1">관리자에게 건물 등록을 요청하세요</p>
        </div>
      )}
    </div>
  )
}

// 관리자용 탭 컴포넌트 (클라이언트)
import AdminCalendarTabs from '@/components/AdminCalendarTabs'
