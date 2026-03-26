import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/daily-routines/submit
// Body: { type: 'standup'|'check_in'|'gratitude', content: {...}, is_public?: boolean }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, content, is_public = false } = body as {
    type: string
    content: Record<string, unknown>
    is_public?: boolean
  }

  // Validate type
  if (!['standup', 'check_in', 'gratitude'].includes(type)) {
    return NextResponse.json({ error: 'Invalid submission type' }, { status: 400 })
  }

  // Validate content based on type
  if (type === 'standup') {
    const c = content as { yesterday?: string; today?: string; blockers?: string }
    const hasContent =
      (c.yesterday && c.yesterday.trim().length > 0) ||
      (c.today && c.today.trim().length > 0) ||
      (c.blockers && c.blockers.trim().length > 0)
    if (!hasContent) {
      return NextResponse.json(
        { error: 'Standup requires at least one field' },
        { status: 400 },
      )
    }
  } else if (type === 'check_in') {
    const c = content as { entries?: unknown[] }
    if (!Array.isArray(c?.entries) || c.entries.length === 0) {
      return NextResponse.json(
        { error: 'Check-in requires at least one task entry' },
        { status: 400 },
      )
    }
    const validSignals = ['green', 'yellow', 'red']
    for (const entry of c.entries) {
      const e = entry as { task_id?: string; signal?: string }
      if (!e.task_id || !e.signal || !validSignals.includes(e.signal)) {
        return NextResponse.json({ error: 'Invalid check-in entry' }, { status: 400 })
      }
    }
  } else if (type === 'gratitude') {
    const c = content as { text?: string }
    if (typeof c?.text !== 'string' || c.text.trim().length === 0) {
      return NextResponse.json({ error: 'Gratitude requires text' }, { status: 400 })
    }
  }

  // Check exclusions and quiet period
  const { data: exclusion } = await supabase
    .from('daily_routines_exclusions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (exclusion) {
    if (type === 'standup' && exclusion.standup_disabled) {
      return NextResponse.json(
        { error: 'Standup is disabled for this user' },
        { status: 403 },
      )
    }
    if (type === 'check_in' && exclusion.check_in_disabled) {
      return NextResponse.json(
        { error: 'Check-in is disabled for this user' },
        { status: 403 },
      )
    }
    if (type === 'gratitude' && exclusion.gratitude_disabled) {
      return NextResponse.json(
        { error: 'Gratitude is disabled for this user' },
        { status: 403 },
      )
    }

    // Check quiet period
    if (exclusion.quiet_period_start && exclusion.quiet_period_end) {
      const today = new Date().toISOString().slice(0, 10)
      if (today >= exclusion.quiet_period_start && today <= exclusion.quiet_period_end) {
        return NextResponse.json(
          { error: 'Quiet period is active for this user' },
          { status: 403 },
        )
      }
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  // Upsert entry — same (user_id, date, type) = update existing row
  const { data: entry, error: upsertError } = await supabase
    .from('daily_entries')
    .upsert(
      {
        user_id: user.id,
        date: today,
        type,
        content: content as import('@/types/database').Json,
        is_public: Boolean(is_public),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date,type' },
    )
    .select()
    .single()

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  // Write audit log
  await supabase.from('audit_log').insert({
    entity_type: 'daily_entries',
    entity_id: entry.id,
    actor_type: 'human',
    actor_ref: user.id,
    event: `daily_routine:${type}_submitted`,
    data: { entry_id: entry.id, date: today },
  })

  // Determine success message
  let message = 'Your submission is recorded. Thank you.'
  if (type === 'standup') message = 'Your standup is recorded. Thank you.'
  if (type === 'check_in') message = 'Your progress check is recorded.'
  if (type === 'gratitude' && is_public) message = 'Thank you for sharing with the team.'
  if (type === 'gratitude' && !is_public) message = 'Thank you for sharing your gratitude.'

  return NextResponse.json({
    success: true,
    entry_id: entry.id,
    message,
  })
}
