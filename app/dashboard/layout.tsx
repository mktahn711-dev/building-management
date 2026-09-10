import { redirect } from 'next/navigation'
import { getAuthedProfile } from '@/lib/get-profile'
import NavBar from '@/components/NavBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getAuthedProfile()

  if (!user) {
    redirect('/login')
  }

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar profile={profile} user={user} />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
