import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_CATEGORIES = ['idea', 'problem', 'request', 'general'] as const

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { category, content, anonymous = false } = body as Record<string, unknown>

  // Validate category
  if (!category || !VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  // Validate content
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'Please share your feedback' }, { status: 400 })
  }

  if (content.length > 1000) {
    return NextResponse.json({ error: 'Max 1000 characters' }, { status: 400 })
  }

  // CRITICAL: anonymous = true → user_id is NOT written. Not null in the sense of "unknown"
  // — the column is simply omitted so the DB default (null) applies.
  // This makes identity unrecoverable at the database level.
  const { data: inserted, error } = await supabase
    .from('feedback')
    .insert({
      category: category as string,
      content: content.trim(),
      // Only set user_id when NOT anonymous. When anonymous, the column is
      // entirely absent from this insert — it gets the DB default (NULL).
      ...(anonymous ? {} : { user_id: user.id }),
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Audit log entry
  await supabase.from('audit_log').insert({
    event: 'feedback:submitted',
    entity_type: 'feedback',
    entity_id: inserted.id,
    actor_type: anonymous ? 'anonymous' : 'user',
    actor_ref: anonymous ? null : user.id,
    data: JSON.parse(JSON.stringify({ category, anonymous: !!anonymous })),
  })

  return NextResponse.json({ success: true, feedbackId: inserted.id }, { status: 201 })
}
