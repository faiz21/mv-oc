import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdminSurface } from '@/lib/roles'

const VALID_STATUSES = ['received', 'under_review', 'responded', 'closed'] as const
type FeedbackStatus = typeof VALID_STATUSES[number]

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ feedbackId: string }> },
) {
  const { feedbackId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!canAccessAdminSurface(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { status, closureNote } = body as Record<string, unknown>

  if (!VALID_STATUSES.includes(status as FeedbackStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  if (status === 'closed' && closureNote && typeof closureNote === 'string' && closureNote.length > 500) {
    return NextResponse.json({ error: 'Closure note max 500 characters' }, { status: 400 })
  }

  // Fetch existing record
  const { data: existing } = await supabase
    .from('feedback')
    .select('status')
    .eq('id', feedbackId)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
  }

  const now = new Date().toISOString()
  const update: Record<string, unknown> = {
    status,
    updated_at: now,
  }

  if (status === 'closed') {
    update.closed_at = now
    if (closureNote && typeof closureNote === 'string' && closureNote.trim()) {
      update.closed_reason = closureNote.trim()
    }
  }

  // Reopening: clear closed fields
  if (status !== 'closed') {
    update.closed_at = null
    update.closed_reason = null
  }

  const { error } = await supabase
    .from('feedback')
    .update(update)
    .eq('id', feedbackId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Determine event name
  const eventMap: Record<FeedbackStatus, string> = {
    received: 'feedback:reopened',
    under_review: 'feedback:status_changed',
    responded: 'feedback:status_changed',
    closed: 'feedback:closed',
  }

  const auditData: Record<string, string> = {
    old_status: existing.status,
    new_status: status as string,
  }
  if (status === 'closed' && closureNote && typeof closureNote === 'string') {
    auditData.closure_note = closureNote
  }

  await supabase.from('audit_log').insert({
    event: eventMap[status as FeedbackStatus],
    entity_type: 'feedback',
    entity_id: feedbackId,
    actor_type: 'user',
    actor_ref: user.id,
    data: auditData,
  })

  return NextResponse.json({ success: true })
}
