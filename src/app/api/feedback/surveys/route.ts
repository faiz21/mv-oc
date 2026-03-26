import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdminSurface } from '@/lib/roles'
import type { SurveyQuestion } from '@/features/feedback-hub/feedback-data'

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

  const { title, description, questions } = body as Record<string, unknown>

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  if (title.length > 100) {
    return NextResponse.json({ error: 'Title max 100 characters' }, { status: 400 })
  }

  if (description && typeof description === 'string' && description.length > 300) {
    return NextResponse.json({ error: 'Description max 300 characters' }, { status: 400 })
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: 'At least one question is required' }, { status: 400 })
  }

  if (questions.length > 5) {
    return NextResponse.json({ error: 'Maximum 5 questions allowed' }, { status: 400 })
  }

  const validTypes = ['multiple_choice', 'rating_scale', 'free_text']
  for (const q of questions as SurveyQuestion[]) {
    if (!q.text || q.text.length > 200) {
      return NextResponse.json({ error: 'Question text max 200 characters' }, { status: 400 })
    }
    if (!validTypes.includes(q.type)) {
      return NextResponse.json({ error: `Invalid question type: ${q.type}` }, { status: 400 })
    }
  }

  const { data: inserted, error } = await supabase
    .from('pulse_surveys')
    .insert({
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() || null : null,
      // Cast through JSON to satisfy the Json type constraint.
      questions: JSON.parse(JSON.stringify(questions)),
      status: 'draft',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, surveyId: inserted.id }, { status: 201 })
}
