import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

interface ResumeWorkflowPayload {
  workflow_run_id: string
  approval_id: string
  decision: 'approved' | 'rejected'
  reviewer_id?: string
  notes?: string
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  let body: ResumeWorkflowPayload
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  const { workflow_run_id, approval_id, decision, reviewer_id, notes } = body

  if (!workflow_run_id || !approval_id || !decision) {
    return new Response(
      JSON.stringify({ error: 'workflow_run_id, approval_id, and decision are required' }),
      { status: 400 },
    )
  }

  if (!['approved', 'rejected'].includes(decision)) {
    return new Response(
      JSON.stringify({ error: 'decision must be "approved" or "rejected"' }),
      { status: 400 },
    )
  }

  // Fetch and validate the approval queue entry
  const { data: approval, error: approvalError } = await supabase
    .from('approval_queue')
    .select('id, status, workflow_run_id')
    .eq('id', approval_id)
    .single()

  if (approvalError || !approval) {
    return new Response(
      JSON.stringify({ error: 'approval_queue entry not found', detail: approvalError?.message }),
      { status: 404 },
    )
  }

  if (approval.status !== 'awaiting_review') {
    return new Response(
      JSON.stringify({ error: `Approval is already in status: ${approval.status}` }),
      { status: 409 },
    )
  }

  // Update approval_queue with decision
  await supabase
    .from('approval_queue')
    .update({
      status: decision,
      decision,
      decision_at: new Date().toISOString(),
      reviewed_by: reviewer_id ?? null,
      notes: notes ?? null,
    })
    .eq('id', approval_id)

  // Write audit log
  await supabase.from('audit_log').insert({
    entity_type: 'approval_queue',
    entity_id: approval_id,
    actor_type: 'human',
    actor_ref: reviewer_id ?? 'unknown',
    event: `approval.${decision}`,
    data: { workflow_run_id, notes },
  })

  if (decision === 'rejected') {
    // Mark workflow run as failed
    await supabase
      .from('workflow_runs')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', workflow_run_id)

    return new Response(
      JSON.stringify({ workflow_run_id, status: 'failed', reason: 'approval_rejected' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Approved — resume workflow
  await supabase
    .from('workflow_runs')
    .update({ status: 'running', updated_at: new Date().toISOString() })
    .eq('id', workflow_run_id)

  // TODO (Phase C): Find the next pending workflow_run_steps for this run
  // TODO (Phase C): Call dispatch-task for each ready next step

  return new Response(
    JSON.stringify({ workflow_run_id, status: 'resumed' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})
