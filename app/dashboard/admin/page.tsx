import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import MaintenanceForm from '@/components/MaintenanceForm'

export default async function AdminPage() {
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

  if (!buildings || buildings.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">관리내역 입력</h1>
          <p className="text-slate-500 text-sm mt-1">건물별 관리 현황을 입력하세요</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-slate-500 font-medium">등록된 건물이 없습니다</p>
          <p className="text-slate-400 text-sm mt-1">먼저 Supabase에서 건물을 등록해주세요</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">관리내역 입력</h1>
        <p className="text-slate-500 text-sm mt-1">건물별 관리 현황을 입력하세요</p>
      </div>
      <MaintenanceForm buildings={buildings} />
    </div>
  )
}
