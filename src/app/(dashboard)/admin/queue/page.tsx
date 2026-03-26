import { requireAuthUser } from '@/lib/data/auth'
import { isAdmin } from '@/lib/roles'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTaskQueue } from '@/lib/data/tasks'
import { TaskQueueTable } from '@/components/admin/TaskQueueTable'

interface Props {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function AdminQueuePage({ searchParams }: Props) {
  const params = await searchParams
  const authUser = await requireAuthUser()
  const admin = isAdmin(authUser.role)
  const statusFilter = params.status || undefined
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const pageSize = 25

  const departmentIds = admin
    ? undefined
    : authUser.departmentMemberships.map((m) => m.department_id)

  const adminClient = createAdminClient()
  const { tasks, total } = await getTaskQueue(adminClient, {
    status: statusFilter,
    departmentIds,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  })

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--on-surface)' }}>
          Task Queue
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
          Inspect blocked work and release tasks that are locked too long.
        </p>
      </div>
      <TaskQueueTable
        tasks={tasks}
        total={total}
        page={page}
        pageSize={pageSize}
        statusFilter={statusFilter}
        isAdmin={admin}
      />
    </div>
  )
}
