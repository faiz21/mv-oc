import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/roles'

// GET /api/daily-routines/exclusions — list exclusions (admin sees all; user sees own)
export async function GET() {
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

  let query = supabase.from('daily_routines_exclusions').select('*')

  // Non-admins can only see their own row
  if (!isAdmin(profile?.role ?? '')) {
    query = query.eq('user_id', user.id)
  }

  const { data: exclusions } = await query

  return NextResponse.json({ exclusions: exclusions ?? [] })
}

// POST /api/daily-routines/exclusions — upsert exclusion (admin for any user; user for own)
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

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const targetUserId = body.user_id as string | undefined

  // Non-admins can only update their own exclusion
  if (!isAdmin(profile?.role ?? '') && targetUserId && targetUserId !== user.id) {
    return NextResponse.json(
      { error: 'Forbidden: cannot modify another user\'s exclusion' },
      { status: 403 },
    )
  }

  const userId = targetUserId ?? user.id

  const payload = {
    user_id: userId,
    standup_disabled: Boolean(body.standup_disabled ?? false),
    check_in_disabled: Boolean(body.check_in_disabled ?? false),
    gratitude_disabled: Boolean(body.gratitude_disabled ?? false),
    quiet_period_start: (body.quiet_period_start as string | null) ?? null,
    quiet_period_end: (body.quiet_period_end as string | null) ?? null,
    reason: (body.reason as string | null) ?? null,
    updated_at: new Date().toISOString(),
  }

  // Check if row exists
  const { data: existing } = await supabase
    .from('daily_routines_exclusions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  let result
  if (existing?.id) {
    const { data, error } = await supabase
      .from('daily_routines_exclusions')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single()
    result = { data, error }
  } else {
    const { data, error } = await supabase
      .from('daily_routines_exclusions')
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
    entity_type: 'daily_routines_exclusions',
    entity_id: result.data.id,
    actor_type: 'human',
    actor_ref: user.id,
    event: 'daily_routines:exclusion_updated',
    data: { exclusion_id: result.data.id, target_user: userId },
  })

  return NextResponse.json({ success: true, exclusion: result.data })
}
