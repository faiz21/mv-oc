import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Submit a response to a pulse survey.
 * All responses are anonymous by design — NO user_id stored.
 * The survey_responses table has no user_id column.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> },
) {
  const { surveyId } = await params
  const supabase = await createClient()

  // Must be authenticated to respond — prevents spam — but user_id is NOT stored.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { answers } = body as Record<string, unknown>

  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return NextResponse.json({ error: 'Answers are required' }, { status: 400 })
  }

  // Verify survey exists and is published
  const now = new Date().toISOString()
  const { data: survey } = await supabase
    .from('pulse_surveys')
    .select('id, status, closes_at, sent_at')
    .eq('id', surveyId)
    .single()

  if (!survey) {
    return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
  }

  if (survey.status !== 'published') {
    return NextResponse.json({ error: 'Survey is not open for responses' }, { status: 400 })
  }

  if (survey.sent_at && new Date(survey.sent_at) > new Date()) {
    return NextResponse.json({ error: 'Survey has not started yet' }, { status: 400 })
  }

  if (survey.closes_at && new Date(survey.closes_at) < new Date(now)) {
    return NextResponse.json({ error: 'Survey has closed' }, { status: 400 })
  }

  // Insert response — intentionally NO user_id field
  // The survey_responses table has no user_id column (anonymous by design).
  const { error } = await supabase
    .from('survey_responses')
    .insert({
      survey_id: surveyId,
      // Cast answers through JSON round-trip to satisfy the Json type constraint.
      answers: JSON.parse(JSON.stringify(answers)) as Record<string, string | number | boolean | null>,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true }, { status: 201 })
}
