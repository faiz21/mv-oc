import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdminSurface } from '@/lib/roles'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> },
) {
  const { surveyId } = await params
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

  const { startAt, closesAt } = body as Record<string, unknown>

  const sentAt = startAt ? new Date(startAt as string) : new Date()
  const closeAt = closesAt
    ? new Date(closesAt as string)
    : new Date(sentAt.getTime() + 7 * 24 * 60 * 60 * 1000)

  const { error } = await supabase
    .from('pulse_surveys')
    .update({
      status: 'published',
      sent_at: sentAt.toISOString(),
      closes_at: closeAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', surveyId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
