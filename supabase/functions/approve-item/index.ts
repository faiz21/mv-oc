import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApproveItemPayload {
  approval_id: string
  decision: 'approved' | 'rejected'
  notes?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Auth: get calling user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { approval_id, decision, notes }: ApproveItemPayload = await req.json()

    if (!approval_id || !decision) {
      return new Response(JSON.stringify({ error: 'approval_id and decision are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch approval queue item
    const { data: item, error: fetchError } = await supabase
      .from('approval_queue')
      .select('*')
      .eq('id', approval_id)
      .single()

    if (fetchError || !item) {
      return new Response(JSON.stringify({ error: 'Approval item not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Enforce: user cannot approve their own submission
    if (item.submitted_by === user.id) {
      return new Response(JSON.stringify({ error: 'You cannot approve your own submission' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Enforce: must be awaiting_review
    if (item.status !== 'awaiting_review') {
      return new Response(JSON.stringify({ error: `Item is already ${item.status}` }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Enforce: rejection requires notes
    if (decision === 'rejected' && !notes?.trim()) {
      return new Response(JSON.stringify({ error: 'Rejection requires a note' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update approval queue
    const { error: updateError } = await supabase
      .from('approval_queue')
      .update({
        status: decision,
        decision,
        reviewed_by: user.id,
        notes: notes ?? null,
        decision_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', approval_id)

    if (updateError) throw updateError

    // If approved: update workflow_run_step status → resume
    if (decision === 'approved' && item.workflow_run_id) {
      // Update run step to ready (triggers orchestrator re-dispatch)
      await supabase
        .from('workflow_run_steps')
        .update({ status: 'ready', updated_at: new Date().toISOString() })
        .eq('workflow_run_id', item.workflow_run_id)
        .eq('status', 'awaiting_approval')

      // Update workflow run to running
      await supabase
        .from('workflow_runs')
        .update({ status: 'running', updated_at: new Date().toISOString() })
        .eq('id', item.workflow_run_id)
        .eq('status', 'awaiting_approval')
    }

    // Audit log entry
    await supabase.from('audit_log').insert({
      entity_type: 'approval_queue',
      entity_id: approval_id,
      workflow_run_id: item.workflow_run_id ?? null,
      actor_type: 'human',
      actor_ref: user.id,
      event: decision === 'approved' ? 'approval:approved' : 'approval:rejected',
      data: {
        gate_type: item.gate_type,
        source_type: item.source_type,
        notes: notes ?? null,
      },
    })

    return new Response(JSON.stringify({ success: true, decision }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
