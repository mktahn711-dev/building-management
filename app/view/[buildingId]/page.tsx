import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import PublicCalendar from '@/components/PublicCalendar'

export default async function PublicViewPage({ params }: { params: { buildingId: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 건물 정보 조회
  const { data: building } = await supabase
    .from('buildings')
    .select('id, name, address')
    .eq('id', params.buildingId)
    .single()

  if (!building) notFound()

  // 이번 달 로그 조회
  const now = new Date()
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`

  const { data: logs } = await supabase
    .from('maintenance_logs')
    .select('*')
    .eq('building_id', building.id)
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="/navlogo.png" alt="ACE" className="h-10 object-contain" />
          <div className="border-l border-slate-200 pl-3">
            <p className="text-xs text-slate-500">관리 현황</p>
            <p className="text-sm font-semibold text-slate-800">{building.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <PublicCalendar
          buildingId={building.id}
          buildingName={building.name}
          initialLogs={logs || []}
        />

        <p className="text-center text-xs text-slate-400 mt-6">
          에이스 종합건물관리 · 조회 전용 페이지
        </p>
      </div>
    </div>
  )
}
