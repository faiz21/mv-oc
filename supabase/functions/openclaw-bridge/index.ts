import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const OPENCLAW_INTERNAL_URL = Deno.env.get('OPENCLAW_INTERNAL_URL') ?? 'http://openclaw:3000'

interface OpenClawBridgePayload {
  task_id: string
  workflow_run_id: string
  workflow_run_step_id: string
  agent_id: string
  packet_type: 'execution' | 'sandbox'
  payload: Record<string, unknown>
  context_packet_id?: string
}

interface OpenClawResult {
  status: string
  output: Record<string, unknown>
  artifacts: Array<{
    artifact_type: string
    title: string
    storage_kind: string
    content?: unknown
    file_path?: string
  }>
  task_items: Array<{
    item_type: string
    title: string
    description?: string
    priority?: number
  }>
  events: Array<{
    event: string
    data?: unknown
  }>
  error?: string
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  let body: OpenClawBridgePayload
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  const {
    task_id,
    workflow_run_id,
    workflow_run_step_id,
    agent_id,
    packet_type,
    payload,
    context_packet_id,
  } = body

  if (!task_id || !workflow_run_id || !agent_id || !packet_type) {
    return new Response(
      JSON.stringify({ error: 'task_id, workflow_run_id, agent_id, and packet_type are required' }),
      { status: 400 },
    )
  }

  // Phase B stub: return mock response without calling OpenClaw
  // TODO (Phase C): Replace stub with real HTTP call to OpenClaw
  const useStub = true // remove in Phase C

  let result: OpenClawResult

  if (useStub) {
    result = {
      status: 'complete',
      output: { stub: true, agent_id, packet_type },
      artifacts: [],
      task_items: [],
      events: [{ event: 'stub.executed', data: { task_id } }],
      error: null as unknown as string,
    }
  } else {
    // Phase C: Real OpenClaw call
    const openClawResponse = await fetch(`${OPENCLAW_INTERNAL_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id,
        workflow_run_id,
        workflow_run_step_id,
        agent_id,
        packet_type,
        payload,
        context_packet_id,
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!openClawResponse.ok) {
      const errorText = await openClawResponse.text()
      await handleTaskFailure(task_id, workflow_run_id, agent_id, errorText)
      return new Response(
        JSON.stringify({ error: 'OpenClaw execution failed', detail: errorText }),
        { status: 502 },
      )
    }

    result = await openClawResponse.json()
  }

  // Normalize result into Supabase tables
  if (result.status === 'complete') {
    await supabase
      .from('tasks')
      .update({
        status: 'complete',
        result: result.output,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', task_id)

    // Normalize artifacts
    for (const artifact of result.artifacts ?? []) {
      await supabase.from('artifacts').insert({
        workflow_run_id,
        workflow_run_step_id,
        task_id,
        artifact_type: artifact.artifact_type,
        title: artifact.title,
        storage_kind: artifact.storage_kind,
        content: artifact.content ?? null,
        file_path: artifact.file_path ?? null,
        created_by_type: 'agent',
        created_by_ref: agent_id,
        correlation_id: task_id,
      })
    }

    // Normalize task_items
    for (const item of result.task_items ?? []) {
      await supabase.from('task_items').insert({
        workflow_run_id,
        workflow_run_step_id,
        task_id,
        item_type: item.item_type,
        title: item.title,
        description: item.description ?? null,
        priority: item.priority ?? 5,
        created_by_type: 'agent',
        created_by_ref: agent_id,
      })
    }

    // Normalize events to audit_log
    for (const ev of result.events ?? []) {
      await supabase.from('audit_log').insert({
        entity_type: 'task',
        entity_id: task_id,
        workflow_run_id,
        actor_type: 'agent',
        actor_ref: agent_id,
        event: ev.event,
        data: ev.data ?? {},
      })
    }
  } else if (result.status === 'awaiting_approval') {
    await supabase
      .from('tasks')
      .update({ status: 'awaiting_approval', updated_at: new Date().toISOString() })
      .eq('id', task_id)

    await supabase
      .from('workflow_runs')
      .update({ status: 'awaiting_approval', updated_at: new Date().toISOString() })
      .eq('id', workflow_run_id)

    await supabase.from('approval_queue').insert({
      task_id,
      workflow_run_id,
      source_type: 'task',
      source_ref: task_id,
      gate_type: 'task-result',
      content: result.output,
      submitted_by: null,
    })
  } else {
    await handleTaskFailure(task_id, workflow_run_id, agent_id, result.error ?? 'unknown error')
  }

  return new Response(
    JSON.stringify({ task_id, status: result.status, result: result.output }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})

async function handleTaskFailure(
  task_id: string,
  workflow_run_id: string,
  agent_id: string,
  error: string,
) {
  await supabase
    .from('tasks')
    .update({
      status: 'failed',
      error,
      updated_at: new Date().toISOString(),
    })
    .eq('id', task_id)

  await supabase.from('incidents').insert({
    incident_type: 'task_failure',
    severity: 'high',
    source_ref: task_id,
    title: `Task failed: ${task_id}`,
    summary: error,
    task_id,
    agent_id,
  })
}
