import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

interface DispatchTaskPayload {
  workflow_run_id: string
  workflow_run_step_id: string
  agent_id: string
  payload?: Record<string, unknown>
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  let body: DispatchTaskPayload
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  const { workflow_run_id, workflow_run_step_id, agent_id, payload = {} } = body

  if (!workflow_run_id || !workflow_run_step_id || !agent_id) {
    return new Response(
      JSON.stringify({ error: 'workflow_run_id, workflow_run_step_id, and agent_id are required' }),
      { status: 400 },
    )
  }

  // Fetch workflow run to get department/project/workflow context
  const { data: run, error: runError } = await supabase
    .from('workflow_runs')
    .select('department_id, project_id, workflow_id, workflow_version_id')
    .eq('id', workflow_run_id)
    .single()

  if (runError || !run) {
    return new Response(
      JSON.stringify({ error: 'workflow_run not found', detail: runError?.message }),
      { status: 404 },
    )
  }

  // Insert task row
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      workflow_run_id,
      workflow_run_step_id,
      workflow_id: run.workflow_id,
      workflow_version_id: run.workflow_version_id,
      project_id: run.project_id,
      department_id: run.department_id,
      type: 'workflow_step',
      status: 'queued',
      agent_id,
      payload,
    })
    .select('id')
    .single()

  if (taskError || !task) {
    return new Response(
      JSON.stringify({ error: 'Failed to create task', detail: taskError?.message }),
      { status: 500 },
    )
  }

  // Insert into task_queue
  await supabase.from('task_queue').insert({ task_id: task.id, priority: 5 })

  // TODO (Phase C): Call build-context-bundle to assemble context packet
  // TODO (Phase C): Update tasks.context_packet_id with returned packet id
  // TODO (Phase C): POST to openclaw-bridge with task + context packet

  // Phase B stub — log dispatch to audit_log
  await supabase.from('audit_log').insert({
    entity_type: 'task',
    entity_id: task.id,
    actor_type: 'system',
    event: 'task.dispatched',
    data: { workflow_run_id, workflow_run_step_id, agent_id, stub: true },
  })

  return new Response(
    JSON.stringify({ task_id: task.id, status: 'dispatched' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})
