import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { sandbox_run_id } = await req.json()
    if (!sandbox_run_id) {
      return new Response(JSON.stringify({ error: 'sandbox_run_id required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Fetch the sandbox run — uses actual sandbox_runs schema
    const { data: run, error: runError } = await supabase
      .from('sandbox_runs')
      .select('*, workflow:workflows(id, name, definition)')
      .eq('id', sandbox_run_id)
      .single()

    if (runError || !run) {
      return new Response(JSON.stringify({ error: 'Sandbox run not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Mark as running — status values: pending | running | complete | failed | cancelled
    await supabase
      .from('sandbox_runs')
      .update({ status: 'running', updated_at: new Date().toISOString() })
      .eq('id', sandbox_run_id)

    const startTime = Date.now()
    const steps: Array<{ step: number; name: string; status: string; output: unknown; duration_ms: number }> = []

    try {
      // Simulate workflow execution — SANDBOX ONLY. Never writes to tasks, approval_queue, audit_log.
      const workflow = run.workflow as { id: string; name: string; definition?: { nodes?: Array<{ id: string; type: string; data?: { label?: string } }> } } | null
      const definition = workflow?.definition ?? null
      const nodes = definition?.nodes ?? []

      // If no nodes, create one synthetic step so the run is meaningful
      const effectiveNodes = nodes.length > 0
        ? nodes
        : [{ id: 'step-1', type: 'system', data: { label: 'Sandbox Step 1' } }]

      for (let i = 0; i < effectiveNodes.length; i++) {
        const node = effectiveNodes[i]
        const stepStart = Date.now()

        const mockInput = {
          mock_payload: run.mock_payload,
          step_index: i,
          node_type: node.type,
        }

        // Simulate step execution — sandbox never calls real agents
        await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 150))

        const mockOutput = {
          sandbox: true,
          node_type: node.type,
          simulated: true,
          result: `Sandbox simulation of ${node.data?.label || node.type}`,
          step_index: i,
        }

        const stepDuration = Date.now() - stepStart

        steps.push({
          step: i + 1,
          name: node.data?.label || node.type || `Step ${i + 1}`,
          status: 'completed',
          output: mockOutput,
          duration_ms: stepDuration,
        })

        console.log(`sandbox-run: step ${i + 1} completed in ${stepDuration}ms`, { input: mockInput })
      }

      const totalDuration = Date.now() - startTime

      // Store result in sandbox_runs.result (jsonb) — the only columns we update are:
      // status, result, execution_time_ms, completed_at, updated_at, error
      // This NEVER touches tasks, approval_queue, workflow_runs, or audit_log
      await supabase
        .from('sandbox_runs')
        .update({
          status: 'complete',
          result: {
            steps,
            step_count: steps.length,
            summary: 'Sandbox run completed successfully',
            final_status: 'completed',
          },
          completed_at: new Date().toISOString(),
          execution_time_ms: totalDuration,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sandbox_run_id)

      console.log(`sandbox-run: completed ${sandbox_run_id} in ${totalDuration}ms, ${steps.length} steps`)

      return new Response(JSON.stringify({
        success: true,
        sandbox_run_id,
        execution_time_ms: totalDuration,
        steps_executed: steps.length,
        status: 'complete',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })

    } catch (execError) {
      const totalDuration = Date.now() - startTime
      console.error('sandbox-run execution error:', execError)

      // Store error in sandbox_runs.error — not in audit_log, not in tasks
      await supabase
        .from('sandbox_runs')
        .update({
          status: 'failed',
          error: String(execError),
          completed_at: new Date().toISOString(),
          execution_time_ms: totalDuration,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sandbox_run_id)

      return new Response(JSON.stringify({ success: false, error: String(execError), sandbox_run_id }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('sandbox-run error:', error)
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
})
