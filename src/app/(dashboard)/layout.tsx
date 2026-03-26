import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Sidebar } from '@/components/layout/Sidebar'
import { UserProvider } from '@/components/providers/user-provider'
import { DepartmentProvider } from '@/components/providers/department-provider'
import { getAuthUser, getPendingApprovalCount } from '@/lib/data/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const pendingApprovals = await getPendingApprovalCount(authUser.id)

  const cookieStore = await cookies()
  const activeSlug = cookieStore.get('mv-active-dept')?.value

  const departments = authUser.departmentMemberships.map((m) => ({
    id: m.department_id,
    name: m.department.name,
    slug: m.department.slug,
    role: m.department_role,
  }))

  return (
    <UserProvider
      user={{
        id: authUser.id,
        email: authUser.email,
        fullName: authUser.profile?.full_name ?? null,
        role: authUser.role,
        avatarUrl: null,
      }}
    >
      <DepartmentProvider departments={departments} initialSlug={activeSlug}>
        <div className="flex min-h-screen bg-[var(--background)]">
          <Sidebar
            userRole={authUser.role}
            userName={authUser.profile?.full_name ?? undefined}
            userEmail={authUser.email}
            pendingApprovals={pendingApprovals}
          />
          <main className="app-shell-main min-w-0 flex-1 overflow-auto">{children}</main>
        </div>
      </DepartmentProvider>
    </UserProvider>
  )
}
