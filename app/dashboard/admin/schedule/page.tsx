import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import ScheduleManager from './ScheduleManager'

export default async function SchedulePage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: buildings } = await supabase
    .from('buildings')
    .select('*')
    .order('name')

  const now = new Date()
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()
  const nextMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1
  const startOfNextMonth = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-01`

  const { data: events } = await supabase
    .from('schedule_events')
    .select('*')
    .gte('date', startOfMonth)
    .lt('date', startOfNextMonth)
    .order('time', { ascending: true, nullsFirst: false })

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
