import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/require-admin-api'
import { writeAudit } from '@/lib/admin/write-audit'
import { runDiagnostics } from '@/lib/admin/diagnostics-runner'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const result = await requireAdminApi()
  if (!result.ok) return result.response

  const adminClient = createAdminClient()
  const diagnostics = await runDiagnostics(adminClient)

  await writeAudit(adminClient, {
    actorId: result.auth.user.id,
    entityType: 'diagnostics',
    entityId: 'run',
    event: 'diagnostics:run',
    data: {
      db_connected: diagnostics.database.connected,
      db_latency_ms: diagnostics.database.latencyMs,
      agents_total: diagnostics.agents.total,
      agents_unreachable: diagnostics.agents.unreachable,
      tasks_stuck: diagnostics.tasks.stuck,
    },
  })

  return NextResponse.json(diagnostics)
}
