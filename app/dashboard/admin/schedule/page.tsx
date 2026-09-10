import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAuthedProfile } from '@/lib/get-profile'
import ScheduleManager from './ScheduleManager'

export default async function SchedulePage() {
  const { user, profile } = await getAuthedProfile()
  if (!user) redirect('/login')

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createServerSupabaseClient()

  const now = new Date()
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()
  const nextMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1
  const startOfNextMonth = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-01`

  // 서로 의존하지 않는 두 조회는 동시에 보낸다
  const [{ data: buildings }, { data: events }] = await Promise.all([
    supabase.from('buildings').select('*').order('name'),
    supabase
      .from('schedule_events')
      .select('*')
      .gte('date', startOfMonth)
      .lt('date', startOfNextMonth)
      .order('time', { ascending: true, nullsFirst: false }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">종합관리 캘린더</h1>
        <p className="text-slate-500 text-sm mt-1">모든 건물의 일정을 한곳에서 등록하고 확인하세요 (관리자 전용)</p>
      </div>
      <ScheduleManager buildings={buildings || []} initialEvents={events || []} />
    </div>
  )
}
