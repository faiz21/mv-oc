import { requireAuthUser } from '@/lib/data/auth'
import { isAdmin } from '@/lib/roles'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildAdminSnapshot } from '@/lib/data/admin-snapshot'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export default async function AdminPage() {
  const authUser = await requireAuthUser()
  const admin = isAdmin(authUser.role)

  const departmentIds = admin
    ? undefined
    : authUser.departmentMemberships.map((m) => m.department_id)

  const adminClient = createAdminClient()
  const snapshot = await buildAdminSnapshot(adminClient, departmentIds)

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--on-surface)' }}>
          Admin & Master Data
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
          Control plane and governance layer for MV-Companion OS.
        </p>
      </div>
      <AdminDashboard snapshot={snapshot} />
    </div>
  )
}
