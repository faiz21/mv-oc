import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile for role and name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, email')
    .eq('id', user.id)
    .single()

  // Fetch pending approvals count
  const { count: pendingApprovals } = await supabase
    .from('approval_queue')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'awaiting_review')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        userRole={profile?.role}
        pendingApprovals={pendingApprovals ?? 0}
        userName={profile?.full_name ?? undefined}
        userEmail={profile?.email ?? user.email}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar pendingApprovals={pendingApprovals ?? 0} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
