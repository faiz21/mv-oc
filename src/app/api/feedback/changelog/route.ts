import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdminSurface } from '@/lib/roles'

export async function POST(req: NextRequest) {
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

  const { title, description, category, relatedFeedbackIds } = body as Record<string, unknown>

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  if (title.length > 100) {
    return NextResponse.json({ error: 'Title max 100 characters' }, { status: 400 })
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  }

  if (description.length > 1000) {
    return NextResponse.json({ error: 'Description max 1000 characters' }, { status: 400 })
  }

  const { data: inserted, error } = await supabase
    .from('changelog')
    .insert({
      title: title.trim(),
      description: description.trim(),
      category: typeof category === 'string' ? category.trim() || null : null,
      related_feedback: Array.isArray(relatedFeedbackIds) ? relatedFeedbackIds : null,
      status: 'draft',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insert into approval_queue as a document gate
  await supabase.from('approval_queue').insert({
    gate_type: 'document',
    source_type: 'changelog',
    source_ref: inserted.id,
    content: {
      changelog_id: inserted.id,
      title: title.trim(),
      description: description.trim(),
      category: typeof category === 'string' ? category : null,
    },
    status: 'pending',
    submitted_by: user.id,
  })

  return NextResponse.json({ success: true, changelogId: inserted.id }, { status: 201 })
}
