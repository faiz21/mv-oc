import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

interface BuildContextPayload {
  workflow_run_id: string
  workflow_run_step_id: string
  task_id: string
  agent_id: string
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  let body: BuildContextPayload
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  const { workflow_run_id, workflow_run_step_id, task_id, agent_id } = body

  if (!workflow_run_id || !workflow_run_step_id || !task_id || !agent_id) {
    return new Response(
      JSON.stringify({
        error: 'workflow_run_id, workflow_run_step_id, task_id, and agent_id are required',
      }),
      { status: 400 },
    )
  }

  // Fetch workflow run
  const { data: run } = await supabase
    .from('workflow_runs')
    .select('workflow_id, workflow_version_id, project_id, department_id, input_payload, status')
    .eq('id', workflow_run_id)
    .single()

  // Fetch workflow run step
  const { data: step } = await supabase
    .from('workflow_run_steps')
    .select('workflow_node_id, status, input_payload')
    .eq('id', workflow_run_step_id)
    .single()

  // Fetch workflow node config (if step exists)
  let nodeConfig: Record<string, unknown> = {}
  if (step?.workflow_node_id) {
    const { data: node } = await supabase
      .from('workflow_nodes')
      .select('node_type, label, config')
      .eq('id', step.workflow_node_id)
      .single()
    if (node) nodeConfig = node as Record<string, unknown>
  }

  // Fetch recent audit events for this run (last 10)
  const { data: auditEvents } = await supabase
    .from('audit_log')
    .select('event, actor_type, actor_ref, data, created_at')
    .eq('workflow_run_id', workflow_run_id)
    .order('created_at', { ascending: false })
    .limit(10)

  // TODO (Phase C): Call memory-projection with a pre-computed query embedding
  // For Phase B stub, memory results are empty
  const memoryResults: unknown[] = []

  // Assemble context state
  const stateJson = {
    workflow_run: {
      id: workflow_run_id,
      status: run?.status,
      input_payload: run?.input_payload,
      project_id: run?.project_id,
      department_id: run?.department_id,
    },
    step: {
      id: workflow_run_step_id,
      status: step?.status,
      input_payload: step?.input_payload,
    },
    node: nodeConfig,
    recent_audit_events: auditEvents ?? [],
    memory_projection: memoryResults,
  }

  // Build prompt text stub
  const promptText = `You are agent ${agent_id}. Execute the workflow step as configured.`

  // Insert context_packets row
  const { data: packet, error: packetError } = await supabase
    .from('context_packets')
    .insert({
      workflow_run_id,
      workflow_run_step_id,
      task_id,
      agent_id,
      packet_type: 'execution',
      state_json: stateJson,
      prompt_text: promptText,
      retrieval_doc_ids: [],
    })
    .select('id')
    .single()

  if (packetError || !packet) {
    return new Response(
      JSON.stringify({ error: 'Failed to create context_packet', detail: packetError?.message }),
      { status: 500 },
    )
  }

  return new Response(
    JSON.stringify({ context_packet_id: packet.id }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})
