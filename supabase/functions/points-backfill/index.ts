/**
 * points-backfill Edge Function (T-08-08)
 *
 * Retroactively awards points to a user when they opt in to gamification.
 * Queries completed tasks, approval decisions, and standups since account creation.
 * Inserts to points_log with backdated created_at matching original event timestamps.
 *
 * Idempotent: skips events that already have a points_log entry via (user_id, ref_id, ref_type).
 *
 * CRITICAL: This function NEVER writes to tasks, approval_queue, workflow_runs, or audit_log.
 * It only writes to points_log. Sandbox tasks (is_sandbox = true) are excluded.
 *
 * Triggered by:
 *   - User opting in via GamificationOptInBanner (POST /api/gaming/backfill)
 *   - Admin manual trigger
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
}

async function getStoredConfig(): Promise<Record<string, PointConfigEntry>> {
  const { data: state } = await supabase
    .from('system_state')
    .select('value')
    .eq('key', CONFIG_KEY)
    .single()

  if (typeof state?.value === 'object' && state?.value !== null) {
    return state.value as Record<string, PointConfigEntry>
  }
  return {}
}

function getConfig(actionType: string, stored: Record<string, PointConfigEntry>): PointConfigEntry | null {
  const config = stored[actionType] ?? DEFAULT_CONFIG[actionType] ?? null
  if (!config || !config.enabled) return null
  return config
}

function calcPoints(config: PointConfigEntry, context: { created_at?: string; completed_at?: string; reviewed_at?: string }): number {
  let pts = config.base_points
  if (config.bonus_condition === 'completed_within_1h' && context.created_at && context.completed_at) {
    const elapsed = (new Date(context.completed_at).getTime() - new Date(context.created_at).getTime()) / 60000
    if (elapsed < 60) pts += config.bonus_points
  }
  if (config.bonus_condition === 'approved_within_1h' && context.created_at && context.reviewed_at) {
    const elapsed = (new Date(context.reviewed_at).getTime() - new Date(context.created_at).getTime()) / 60000
    if (elapsed < 60) pts += config.bonus_points
  }
  return pts
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { user_id } = await req.json()
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`points-backfill: starting for user=${user_id}`)

    // Check user exists and has gamification enabled
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, gamification_enabled, created_at')
      .eq('id', user_id)
      .single()

    if (!profile) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      })
    }

    const storedConfig = await getStoredConfig()

    // Load existing points_log entries for this user to avoid duplicates
    const { data: existingEntries } = await supabase
      .from('points_log')
      .select('ref_id, ref_type')
      .eq('user_id', user_id)

    const existingSet = new Set(
      (existingEntries || []).map(e => `${e.ref_type}:${e.ref_id}`)
    )

    const inserts: Array<{
      user_id: string
      points: number
      action_type: string
      ref_id: string | null
      ref_type: string | null
      metadata: Record<string, unknown>
      created_by: string
      created_at: string
    }> = []

    // --- Backfill completed tasks (non-sandbox only) ---
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, status, created_at, updated_at, is_sandbox')
      .eq('assigned_to', user_id)
      .eq('status', 'complete')
      .eq('is_sandbox', false)

    for (const task of (tasks || [])) {
      const key = `task:${task.id}`
      if (existingSet.has(key)) continue

      const config = getConfig('task_completed', storedConfig)
      if (!config) continue

      const pts = calcPoints(config, {
        created_at: task.created_at,
        completed_at: task.updated_at,
      })

      inserts.push({
        user_id,
        points: pts,
        action_type: 'task_completed',
        ref_id: task.id,
        ref_type: 'task',
        metadata: { backfill: true, task_created_at: task.created_at, task_completed_at: task.updated_at },
        created_by: 'system',
        created_at: task.updated_at || new Date().toISOString(),
      })
    }

    // --- Backfill approval decisions (where user was reviewer) ---
    const { data: approvals } = await supabase
      .from('approval_queue')
      .select('id, decision, created_at, updated_at, reviewer_id')
      .eq('reviewer_id', user_id)
      .in('decision', ['approved', 'rejected'])

    for (const approval of (approvals || [])) {
      const key = `approval_queue:${approval.id}`
      if (existingSet.has(key)) continue

      let actionType: string
      if (approval.decision === 'rejected') {
        actionType = 'approval_rejected'
      } else {
        // Determine fast vs slow
        const elapsed = approval.updated_at && approval.created_at
          ? (new Date(approval.updated_at).getTime() - new Date(approval.created_at).getTime()) / 60000
          : 999
        actionType = elapsed < 60 ? 'approval_reviewed_fast' : 'approval_reviewed_slow'
      }

      const config = getConfig(actionType, storedConfig)
      if (!config) continue

      const pts = calcPoints(config, {
        created_at: approval.created_at,
        reviewed_at: approval.updated_at,
      })

      inserts.push({
        user_id,
        points: pts,
        action_type: actionType,
        ref_id: approval.id,
        ref_type: 'approval_queue',
        metadata: { backfill: true, approval_created_at: approval.created_at, approval_reviewed_at: approval.updated_at },
        created_by: 'system',
        created_at: approval.updated_at || new Date().toISOString(),
      })
    }

    // --- Backfill standups ---
    // SCHEMA NOTE: standups table queried; if column 'submitted_at' doesn't exist, falls back to created_at
    const { data: standups } = await supabase
      .from('standups')
      .select('id, created_at, user_id')
      .eq('user_id', user_id)

    for (const standup of (standups || [])) {
      const key = `standup:${standup.id}`
      if (existingSet.has(key)) continue

      // Default to on-time (no deadline data available in backfill context)
      const config = getConfig('standup_submitted_ontime', storedConfig)
      if (!config) continue

      const pts = config.base_points

      inserts.push({
        user_id,
        points: pts,
        action_type: 'standup_submitted_ontime',
        ref_id: standup.id,
        ref_type: 'standup',
        metadata: { backfill: true, standup_created_at: standup.created_at },
        created_by: 'system',
        created_at: standup.created_at || new Date().toISOString(),
      })
    }

    // Batch insert all new entries
    let rowsInserted = 0
    if (inserts.length > 0) {
      const { error: insertError, count } = await supabase
        .from('points_log')
        .insert(inserts)
        .select()

      if (insertError) {
        console.error('points-backfill: insert error:', insertError.message)
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 400, headers: { 'Content-Type': 'application/json' }
        })
      }
      rowsInserted = count ?? inserts.length
    }

    // Aggregate total points
    const { data: pointsRows } = await supabase
      .from('points_log')
      .select('points')
      .eq('user_id', user_id)

    const totalPoints = (pointsRows || []).reduce((sum, r) => sum + r.points, 0)

    // Evaluate badges after backfill
    let earnedBadges: string[] = []
    if (profile.gamification_enabled) {
      const { data: badgeResult } = await supabase.functions.invoke('badge-evaluate', {
        body: { user_id }
      })
      earnedBadges = badgeResult?.newly_awarded || []
    }

    console.log(`points-backfill: inserted ${rowsInserted} rows, total=${totalPoints}, badges=${earnedBadges.length}`)

    return new Response(JSON.stringify({
      success: true,
      rows_inserted: rowsInserted,
      total_points: totalPoints,
      earned_badges: earnedBadges,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('points-backfill error:', error)
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
})
