import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/require-admin-api'
import { writeAudit } from '@/lib/admin/write-audit'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const result = await requireAdminApi({ adminOnly: true })
  if (!result.ok) return result.response

  const { taskId } = await params
  const body = (await request.json()) as { reason?: string }

  if (!body.reason?.trim()) {
    return NextResponse.json({ error: 'A reason is required.' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: task, error: taskError } = await adminClient
    .from('tasks')
    .select('id, status, type, attempt_count')
    .eq('id', taskId)
    .single()

  if (taskError || !task) {
    return NextResponse.json({ error: 'Task not found.' }, { status: 404 })
  }

  if (task.status !== 'running' && task.status !== 'blocked') {
    return NextResponse.json(
      { error: `Task is in "${task.status}" status and cannot be force-released.` },
      { status: 400 },
    )
  }

  const { error: updateError } = await adminClient
    .from('tasks')
    .update({
      status: 'pending',
      agent_id: null,
      assigned_to: null,
      attempt_count: task.attempt_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  await writeAudit(adminClient, {
    actorId: result.auth.user.id,
    entityType: 'task',
    entityId: taskId,
    event: 'task:force_released',
    data: { type: task.type, previous_status: task.status, reason: body.reason },
  })

  return NextResponse.json({ success: true })
}
