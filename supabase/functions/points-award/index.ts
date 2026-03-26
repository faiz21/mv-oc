/**
 * points-award Edge Function
 *
 * Awards points to a user for a specific action. Reads point configuration
 * from system_state (key: 'gamification_point_config') since point_config
 * table is not yet migrated. Writes to points_log (canonical, append-only).
 *
 * CRITICAL: This function NEVER writes to tasks, approval_queue, workflow_runs,
 * or audit_log. It is a side-effect of those events, not part of them.
 *
 * Sandbox tasks are excluded by the trigger (is_sandbox = false check).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const CONFIG_KEY = 'gamification_point_config'

interface PointConfigEntry {
  base_points: number
  bonus_points: number
  bonus_condition: string | null
  enabled: boolean
}

const DEFAULT_CONFIG: Record<string, PointConfigEntry> = {
  task_completed:           { base_points: 10, bonus_points: 5,  bonus_condition: 'completed_within_1h', enabled: true },
  approval_reviewed_fast:   { base_points: 15, bonus_points: 0,  bonus_condition: null, enabled: true },
  approval_reviewed_slow:   { base_points: 5,  bonus_points: 0,  bonus_condition: null, enabled: true },
  approval_rejected:        { base_points: 5,  bonus_points: 0,  bonus_condition: null, enabled: true },
  standup_submitted_ontime: { base_points: 5,  bonus_points: 0,  bonus_condition: null, enabled: true },
  standup_submitted_late:   { base_points: 2,  bonus_points: 0,  bonus_condition: null, enabled: true },
  incident_high_severity:   { base_points: 25, bonus_points: 0,  bonus_condition: null, enabled: true },
  workflow_created:         { base_points: 10, bonus_points: 0,  bonus_condition: null, enabled: true },
  daily_login:              { base_points: 2,  bonus_points: 0,  bonus_condition: null, enabled: true },
}

interface PointsAwardRequest {
  user_id: string
  action_type: string
  ref_id?: string
  ref_type?: 'task' | 'approval_queue' | 'standup' | 'workflow' | 'login'
  workflow_run_id?: string
  context?: {
    task_created_at?: string
    task_completed_at?: string
    approval_created_at?: string
    approval_reviewed_at?: string
    user_timezone?: string
    standup_submitted_at?: string
  }
}

async function getPointConfig(actionType: string): Promise<PointConfigEntry | null> {
  const { data: state } = await supabase
    .from('system_state')
    .select('value')
    .eq('key', CONFIG_KEY)
    .single()

  const stored = typeof state?.value === 'object' && state?.value !== null
    ? state.value as Record<string, PointConfigEntry>
    : {}

  const config = stored[actionType] ?? DEFAULT_CONFIG[actionType] ?? null
  if (!config || !config.enabled) return null
  return config
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const body: PointsAwardRequest = await req.json()

    if (!body.user_id || !body.action_type) {
      return new Response(JSON.stringify({ error: 'user_id and action_type required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`points-award: user=${body.user_id} action=${body.action_type}`)

    // Check if user has gamification enabled
    const { data: profile } = await supabase
      .from('profiles')
      .select('gamification_enabled')
      .eq('id', body.user_id)
      .single()

    // Fetch point config from system_state
    const config = await getPointConfig(body.action_type)

    if (!config) {
      console.log(`points-award: no enabled config for ${body.action_type}`)
      return new Response(JSON.stringify({ success: false, error: 'No point config found for action_type' }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    }

    let pointsToAward = config.base_points

    // Calculate bonus — completed_within_1h
    if (config.bonus_condition === 'completed_within_1h' && body.context?.task_created_at && body.context?.task_completed_at) {
      const elapsed = (new Date(body.context.task_completed_at).getTime() - new Date(body.context.task_created_at).getTime()) / 60000
      if (elapsed < 60) {
        pointsToAward += config.bonus_points
        console.log(`points-award: time bonus applied (+${config.bonus_points}), elapsed=${elapsed.toFixed(1)}min`)
      }
    }

    // Calculate bonus — approved_within_1h
    if (config.bonus_condition === 'approved_within_1h' && body.context?.approval_created_at && body.context?.approval_reviewed_at) {
      const elapsed = (new Date(body.context.approval_reviewed_at).getTime() - new Date(body.context.approval_created_at).getTime()) / 60000
      if (elapsed < 60) {
        pointsToAward += config.bonus_points
        console.log(`points-award: approval time bonus applied (+${config.bonus_points}), elapsed=${elapsed.toFixed(1)}min`)
      }
    }

    // Insert into points_log — canonical, append-only, immutable
    // Never writes to tasks, approval_queue, workflow_runs, or audit_log
    const { error: logError } = await supabase
      .from('points_log')
      .insert({
        user_id: body.user_id,
        points: pointsToAward,
        action_type: body.action_type,
        ref_id: body.ref_id || null,
        ref_type: body.ref_type || null,
        metadata: {
          workflow_run_id: body.workflow_run_id || null,
          context: body.context || null,
        },
        created_by: 'system',
      })

    if (logError) {
      console.error('points_log insert error:', logError.message)
      return new Response(JSON.stringify({ success: false, error: logError.message }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Aggregate total points from points_log
    const { data: pointsRows } = await supabase
      .from('points_log')
      .select('points')
      .eq('user_id', body.user_id)

    const totalPoints = pointsRows?.reduce((sum, row) => sum + row.points, 0) ?? 0

    console.log(`points-award: awarded ${pointsToAward} to ${body.user_id}, total=${totalPoints}`)

    // Evaluate badges — only if gamification enabled
    let newBadges: string[] = []
    if (profile?.gamification_enabled) {
      const { data: badgeResult } = await supabase.functions.invoke('badge-evaluate', {
        body: { user_id: body.user_id }
      })
      newBadges = badgeResult?.newly_awarded || []
    }

    // Broadcast realtime event — only for opted-in users
    if (profile?.gamification_enabled) {
      await supabase.channel('gaming:points').send({
        type: 'broadcast',
        event: 'points_awarded',
        payload: {
          user_id: body.user_id,
          points: pointsToAward,
          total_points: totalPoints,
          action_type: body.action_type,
          new_badges: newBadges,
          timestamp: new Date().toISOString(),
        }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      points_awarded: pointsToAward,
      total_points: totalPoints,
      new_badges: newBadges,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('points-award error:', error)
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
})
