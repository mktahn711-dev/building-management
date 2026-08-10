import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import BuildingsManager from './BuildingsManager'

export default async function BuildingsPage() {
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">건물 관리</h1>
        <p className="text-slate-500 text-sm mt-1">건물을 추가하거나 삭제할 수 있습니다</p>
      </div>
      <BuildingsManager initialBuildings={buildings || []} />
    </div>
  )
}
