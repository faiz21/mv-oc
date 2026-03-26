import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdminSurface } from '@/lib/roles'
import { getFeedbackMetrics, getWeeklyVolume } from '@/features/feedback-hub/feedback-data'
import type { FeedbackCategory } from '@/features/feedback-hub/feedback-data'

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('start_date') ?? undefined
  const endDate = searchParams.get('end_date') ?? undefined
  const category = (searchParams.get('category') ?? undefined) as FeedbackCategory | undefined
  const weeks = parseInt(searchParams.get('weeks') ?? '8', 10)

  const [metrics, weeklyVolume] = await Promise.all([
    getFeedbackMetrics(supabase, { startDate, endDate, category }),
    getWeeklyVolume(supabase, isNaN(weeks) ? 8 : weeks, category),
  ])

  return NextResponse.json({ metrics, weeklyVolume })
}
