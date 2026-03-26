import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/roles'

// GET /api/daily-routines/config — fetch current config (authenticated users)
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: config } = await supabase
    .from('daily_routines_config')
    .select('*')
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ config: config ?? null })
}

// POST /api/daily-routines/config — update config (admin only)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate hours
  const hourFields = [
    'standup_start_hour',
    'standup_end_hour',
    'check_in_start_hour',
    'check_in_end_hour',
    'digest_time_hour',
  ]
  for (const field of hourFields) {
    if (field in body) {
      const val = Number(body[field])
      if (isNaN(val) || val < 0 || val > 23) {
        return NextResponse.json(
          { error: `${field} must be between 0 and 23` },
          { status: 400 },
        )
      }
    }
  }

  if ('digest_time_minute' in body) {
    const min = Number(body.digest_time_minute)
    if (isNaN(min) || min < 0 || min > 59) {
      return NextResponse.json(
        { error: 'digest_time_minute must be between 0 and 59' },
        { status: 400 },
      )
    }
  }

  // reminders_enabled must default false (never force-true)
  const payload: Record<string, unknown> = {
    standup_start_hour: body.standup_start_hour,
    standup_end_hour: body.standup_end_hour,
    check_in_start_hour: body.check_in_start_hour,
    check_in_end_hour: body.check_in_end_hour,
    digest_time_hour: body.digest_time_hour,
    digest_time_minute: body.digest_time_minute,
    digest_channel_discord: body.digest_channel_discord ?? null,
    digest_channel_teams: body.digest_channel_teams ?? null,
    digest_enabled: body.digest_enabled ?? true,
    reminders_enabled: body.reminders_enabled ?? false, // off by default
    reminder_time_hour: body.reminders_enabled ? (body.reminder_time_hour ?? null) : null,
    reminder_time_minute: body.reminders_enabled ? (body.reminder_time_minute ?? null) : null,
    timezone: body.timezone ?? 'UTC',
    updated_at: new Date().toISOString(),
  }

  // Fetch existing config to determine upsert key
  const { data: existing } = await supabase
    .from('daily_routines_config')
    .select('id')
    .limit(1)
    .maybeSingle()

  let result
  if (existing?.id) {
    const { data, error } = await supabase
      .from('daily_routines_config')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single()
    result = { data, error }
  } else {
    const { data, error } = await supabase
      .from('daily_routines_config')
      .insert(payload)
      .select()
      .single()
    result = { data, error }
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  if (!result.data) {
    return NextResponse.json({ error: 'No data returned from upsert' }, { status: 500 })
  }

  await supabase.from('audit_log').insert({
    entity_type: 'daily_routines_config',
    entity_id: result.data.id,
    actor_type: 'human',
    actor_ref: user.id,
    event: 'daily_routines:config_updated',
    data: { config_id: result.data.id },
  })

  return NextResponse.json({ success: true, config: result.data })
}
