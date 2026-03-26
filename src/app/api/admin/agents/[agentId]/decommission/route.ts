import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/require-admin-api'
import { writeAudit } from '@/lib/admin/write-audit'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const result = await requireAdminApi({ adminOnly: true })
  if (!result.ok) return result.response

  const { agentId } = await params
  const body = (await request.json()) as { reason?: string }

  if (!body.reason?.trim()) {
    return NextResponse.json({ error: 'A reason is required.' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: agent, error: agentError } = await adminClient
    .from('agents')
    .select('id, name, status')
    .eq('id', agentId)
    .single()

  if (agentError || !agent) {
    return NextResponse.json({ error: 'Agent not found.' }, { status: 404 })
  }

  if (agent.status === 'decommissioned') {
    return NextResponse.json({ error: 'Agent is already decommissioned.' }, { status: 400 })
  }

  const now = new Date().toISOString()

  // Decommission the runtime agent
  await adminClient
    .from('agents')
    .update({ status: 'decommissioned', deleted_at: now, updated_at: now })
    .eq('id', agentId)

  // Also archive the corresponding definition if linked
  await adminClient
    .from('agent_definitions')
    .update({ status: 'archived', updated_at: now })
    .eq('published_agent_id', agentId)

  await writeAudit(adminClient, {
    actorId: result.auth.user.id,
    entityType: 'agent',
    entityId: agentId,
    event: 'agent:decommissioned',
    data: { name: agent.name, reason: body.reason },
  })

  return NextResponse.json({ success: true })
}
