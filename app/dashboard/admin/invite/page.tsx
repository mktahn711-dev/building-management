import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAuthedProfile } from '@/lib/get-profile'
import InviteForm from './InviteForm'

export default async function InvitePage() {
  const { user, profile } = await getAuthedProfile()
  if (!user) redirect('/login')

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createServerSupabaseClient()

  const { data: buildings } = await supabase
    .from('buildings')
    .select('id, name')
    .order('name')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">건물주 초대</h1>
        <p className="text-slate-500 text-sm mt-1">이메일로 건물주를 초대하세요</p>
      </div>
      <InviteForm buildings={buildings || []} />
    </div>
  )
}
