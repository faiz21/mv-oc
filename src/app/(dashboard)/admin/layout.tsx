import { redirect } from 'next/navigation'
import { requireAuthUser } from '@/lib/data/auth'
import { canAccessAdminModule, isAdmin } from '@/lib/roles'
import { AdminProvider } from '@/components/providers/AdminContext'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authUser = await requireAuthUser()

  if (!canAccessAdminModule(authUser.role)) {
    redirect('/hub')
  }

  const departmentIds = authUser.departmentMemberships.map((m) => m.department_id)

  return (
    <AdminProvider
      value={{
        userId: authUser.id,
        isAdmin: isAdmin(authUser.role),
        isDirector: !isAdmin(authUser.role),
        departmentIds,
      }}
    >
      {children}
    </AdminProvider>
  )
}
