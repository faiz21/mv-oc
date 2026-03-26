import { createAdminClient } from '@/lib/supabase/admin'
import { getAuditLog } from '@/lib/data/audit'
import { AuditLogTable } from '@/components/admin/AuditLogTable'

interface Props {
  searchParams: Promise<{ entityType?: string; page?: string }>
}

export default async function AdminAuditLogPage({ searchParams }: Props) {
  const params = await searchParams
  const entityType = params.entityType || undefined
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const pageSize = 25

  const adminClient = createAdminClient()
  const { entries, total } = await getAuditLog(adminClient, {
    entityType,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  })

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--on-surface)' }}>
          Audit Log
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
          Trace governance events, changes, and exports.
        </p>
      </div>
      <AuditLogTable
        entries={entries}
        total={total}
        page={page}
        pageSize={pageSize}
        entityTypeFilter={entityType}
      />
    </div>
  )
}
