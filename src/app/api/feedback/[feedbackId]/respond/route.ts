import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdminSurface } from '@/lib/roles'

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

  const { response, status = 'responded' } = body as Record<string, unknown>

  // Validate response text
  if (!response || typeof response !== 'string' || response.trim().length === 0) {
    return NextResponse.json({ error: 'Response text is required' }, { status: 400 })
  }

  if (response.length > 2000) {
    return NextResponse.json({ error: 'Max 2000 characters' }, { status: 400 })
  }

  const validStatuses = ['received', 'under_review', 'responded', 'closed']
  if (!validStatuses.includes(status as string)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Fetch existing record to log the old status
  const { data: existing } = await supabase
    .from('feedback')
    .select('status, user_id')
    .eq('id', feedbackId)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
  }

  const now = new Date().toISOString()

  const { error } = await supabase
    .from('feedback')
    .update({
      response: response.trim(),
      response_at: now,
      status: 'responded',
      updated_at: now,
    })
    .eq('id', feedbackId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Audit log
  await supabase.from('audit_log').insert({
    event: 'feedback:responded',
    entity_type: 'feedback',
    entity_id: feedbackId,
    actor_type: 'user',
    actor_ref: user.id,
    data: {
      old_status: existing.status,
      new_status: 'responded',
    },
  })

  return NextResponse.json({ success: true })
}
