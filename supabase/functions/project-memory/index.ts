import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * project-memory — Pre-step projection hook
 *
 * Called before an agent-task step fires.
 * Enriches the context_bundle with memory_context from pgvector.
 * Non-blocking: step proceeds even if projection fails.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const {
      workflow_run_id,
      workflow_run_step_id,
      agent_id,
      entity_id,
      context_bundle,
    } = await req.json()

    if (!workflow_run_id || !agent_id) {
      return new Response(
        JSON.stringify({ error: 'workflow_run_id and agent_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build a query embedding from the current context
    // In production this calls OpenAI embeddings API
    // For now: fetch relevant memory_facts and agent lessons without embedding
    const [factsResult, lessonsResult, summaryResult] = await Promise.all([
      // Relevant memory facts for this workflow's entity
      supabase
        .from('memory_facts')
        .select('fact_key, fact_value, fact_type')
        .eq('scope', 'workflow_run')
        .eq('scope_ref', workflow_run_id)
        .eq('approved', true)
        .limit(10),

      // Agent lessons (top confidence)
      supabase
        .from('agent_lessons_learned')
        .select('lesson, confidence, context, applies_to')
        .eq('agent_id', agent_id)
        .gte('confidence', 3)
        .order('confidence', { ascending: false })
        .limit(5),

      // Today's agent summary
      supabase
        .from('agent_daily_summaries')
        .select('summary, task_count, error_count, key_patterns')
        .eq('agent_id', agent_id)
        .eq('date', new Date().toISOString().split('T')[0])
        .single(),
    ])

    const memory_context = {
      key_facts: (factsResult.data ?? []).map((f) => `${f.fact_key}: ${JSON.stringify(f.fact_value)}`),
      agent_lessons: (lessonsResult.data ?? []).map((l) => l.lesson),
      today_summary: summaryResult.data?.summary ?? null,
      entity_takeaway: null, // populated by embedding search when OpenAI key available
      task_item_takeaway: null,
    }

    // Enrich context_bundle
    const enriched_bundle = {
      ...context_bundle,
      memory_context,
    }

    // Store context packet for audit/resume
    const { data: packet } = await supabase
      .from('context_packets')
      .insert({
        workflow_run_id,
        workflow_run_step_id: workflow_run_step_id ?? null,
        agent_id,
        packet_type: 'production',
        context_bundle: enriched_bundle,
      })
      .select('id')
      .single()

    return new Response(
      JSON.stringify({
        context_packet_id: packet?.id ?? null,
        context_bundle: enriched_bundle,
        memory_projection_status: 'ok',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    // Non-blocking: return partial success so step can still proceed
    return new Response(
      JSON.stringify({
        context_bundle: {},
        memory_projection_status: 'failed',
        error: (error as Error).message,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
