import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuditLogForExport } from '@/lib/data/audit'
import { requireAdminApi } from '@/lib/admin/require-admin-api'
import { writeAudit } from '@/lib/admin/write-audit'

export async function GET(req: NextRequest) {
  const result = await requireAdminApi()
  if (!result.ok) return result.response

  const { searchParams } = req.nextUrl
  const entityType = searchParams.get('entityType') || undefined
  const dateFrom = searchParams.get('dateFrom') || undefined
  const dateTo = searchParams.get('dateTo') || undefined

  const adminClient = createAdminClient()
  const entries = await getAuditLogForExport(adminClient, { entityType, dateFrom, dateTo })

  // Build CSV
  const header = 'id,created_at,event,entity_type,entity_id,actor_type,actor_ref,data'
  const rows = entries.map((e) => {
    const data = e.data ? JSON.stringify(e.data).replace(/"/g, '""') : ''
    return [
      e.id,
      e.created_at,
      e.event,
      e.entity_type,
      e.entity_id ?? '',
      e.actor_type ?? '',
      e.actor_ref ?? '',
      `"${data}"`,
    ].join(',')
  })
  const csv = [header, ...rows].join('\n')

  await writeAudit(adminClient, {
    actorId: result.auth.user.id,
    entityType: 'audit_log',
    entityId: 'export',
    event: 'audit_log:exported',
    data: { count: entries.length, entityType: entityType ?? 'all' },
  })

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
