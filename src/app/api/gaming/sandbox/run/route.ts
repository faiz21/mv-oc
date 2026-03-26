import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { workflow_id, mock_payload } = await req.json()

    if (!workflow_id) return NextResponse.json({ error: 'workflow_id required' }, { status: 400 })

    // Verify workflow exists and is accessible
    const { data: workflow } = await supabase
      .from('workflows')
      .select('id, name, status')
      .eq('id', workflow_id)
      .single()

    if (!workflow) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })

    // Insert sandbox run row — this NEVER creates a tasks row
    const { data: run, error: runError } = await supabase
      .from('sandbox_runs')
      .insert({
        user_id: user.id,
        workflow_id,
        mock_payload: mock_payload || {},
        status: 'pending',
      })
      .select()
      .single()

    if (runError || !run) return NextResponse.json({ error: runError?.message || 'Failed to create run' }, { status: 400 })

    // Trigger the sandbox-run Edge Function asynchronously
    // Fire-and-forget: client polls /api/gaming/sandbox/runs/[runId] for completion
    supabase.functions.invoke('sandbox-run', {
      body: { sandbox_run_id: run.id }
    }).catch((err) => {
      console.error(`sandbox-run trigger failed for run ${run.id}:`, err)
    })

    return NextResponse.json({ success: true, sandbox_run_id: run.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
