/**
 * Admin API — Point Configuration
 *
 * SCHEMA FLAG: The PRD specifies a dedicated `point_config` table
 * (B.impl-08-gaming-session.md T-08-01). That table does not yet appear
 * in the generated database.ts types. Until it is migrated, point
 * configuration is stored as a JSONB value in `system_state` under key
 * 'gamification_point_config'. All reads/writes are admin-only.
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const CONFIG_KEY = 'gamification_point_config'

// Default point configuration — mirrors PRD-08 defaults
const DEFAULT_CONFIG = {
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

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
  return profile?.role === 'admin'
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await requireAdmin(supabase, user.id)) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { data: state } = await supabase
    .from('system_state')
    .select('value')
    .eq('key', CONFIG_KEY)
    .single()

  const storedConfig = typeof state?.value === 'object' && state?.value !== null
    ? state.value as Record<string, { base_points: number; bonus_points: number; bonus_condition: string | null; enabled: boolean }>
    : {}

  // Merge stored config with defaults — stored values override defaults
  const merged = Object.entries(DEFAULT_CONFIG).map(([action_type, defaults]) => ({
    action_type,
    id: action_type, // synthetic id for the panel
    ...defaults,
    ...(storedConfig[action_type] || {}),
  }))

  return NextResponse.json(merged)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await requireAdmin(supabase, user.id)) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await req.json()
  const { action_type, base_points, bonus_points, enabled } = body

  if (!action_type) return NextResponse.json({ error: 'action_type required' }, { status: 400 })

  // Read existing config
  const { data: existing } = await supabase
    .from('system_state')
    .select('value')
    .eq('key', CONFIG_KEY)
    .single()

  const currentConfig = typeof existing?.value === 'object' && existing?.value !== null
    ? { ...(existing.value as Record<string, unknown>) }
    : { ...DEFAULT_CONFIG }

  const oldValue = (currentConfig as Record<string, unknown>)[action_type]

  const updatedEntry = {
    ...((currentConfig as Record<string, unknown>)[action_type] as object || DEFAULT_CONFIG[action_type as keyof typeof DEFAULT_CONFIG] || {}),
    ...(base_points !== undefined ? { base_points } : {}),
    ...(bonus_points !== undefined ? { bonus_points } : {}),
    ...(enabled !== undefined ? { enabled } : {}),
  }

  const newConfig = { ...currentConfig, [action_type]: updatedEntry }

  const { data, error } = await supabase
    .from('system_state')
    .upsert({ key: CONFIG_KEY, value: newConfig, updated_at: new Date().toISOString(), updated_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Log configuration change to audit_log
  await supabase.from('audit_log').insert({
    event: 'gamification_config_changed',
    entity_type: 'system_state',
    entity_id: CONFIG_KEY,
    actor_type: 'human',
    actor_ref: user.id,
    // Cast to Json-compatible structure — all values are serialisable
    data: JSON.parse(JSON.stringify({
      field: action_type,
      old_value: oldValue ?? null,
      new_value: updatedEntry,
    })),
  })

  return NextResponse.json(data)
}
