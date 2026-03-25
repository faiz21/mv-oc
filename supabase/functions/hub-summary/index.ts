import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parallel aggregation queries
    const [
      activeRunsResult,
      pendingApprovalsResult,
      myTasksResult,
      agentHealthResult,
      systemStateResult,
    ] = await Promise.all([
      // Active workflow runs
      supabase
        .from('workflow_runs')
        .select('id', { count: 'exact', head: true })
        .in('status', ['running', 'awaiting_approval']),

      // Pending approvals assigned to this user or unassigned
      supabase
        .from('approval_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'awaiting_review'),

      // Tasks assigned to this user
      supabase
        .from('tasks')
        .select('id, title, status, due_at, workflow_id, priority', { count: 'exact' })
        .eq('assigned_to', user.id)
        .in('status', ['pending', 'queued', 'running', 'awaiting_approval'])
        .order('priority', { ascending: false })
        .limit(10),

      // Agent health summary
      supabase
        .from('agents')
        .select('id, name, status, last_seen, error_rate_24h')
        .neq('deleted_at', null)
        .order('status'),

      // System state
      supabase
        .from('system_state')
        .select('key, value'),
    ])

    // Count healthy vs unhealthy agents
    const agents = agentHealthResult.data ?? []
    const healthyAgents = agents.filter((a) => a.status === 'active').length
    const totalAgents = agents.length

    // Recent audit log (last 20 events)
    const { data: recentActivity } = await supabase
      .from('audit_log')
      .select('id, entity_type, entity_id, actor_type, actor_ref, event, data, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    const summary = {
      active_runs: activeRunsResult.count ?? 0,
      pending_approvals: pendingApprovalsResult.count ?? 0,
      my_tasks: myTasksResult.data ?? [],
      my_tasks_count: myTasksResult.count ?? 0,
      agents_healthy: healthyAgents,
      agents_total: totalAgents,
      system_state: Object.fromEntries(
        (systemStateResult.data ?? []).map((s) => [s.key, s.value])
      ),
      recent_activity: recentActivity ?? [],
    }

    return new Response(JSON.stringify(summary), {
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
