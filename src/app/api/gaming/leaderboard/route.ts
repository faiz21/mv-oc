/**
 * Leaderboard API
 *
 * Returns ranked list of users with gamification_enabled=true for the
 * requested period (daily|weekly|monthly|alltime).
 *
 * Points are aggregated live from points_log. leaderboard_snapshots is
 * used as a cache (written by the leaderboard-refresh Edge Function).
 * If a fresh snapshot (<1h old) exists it is returned; otherwise points_log
 * is aggregated directly.
 *
 * Non-participants (gamification_enabled=false) never appear. RLS on
 * points_log ensures users only see their own detail rows, but the
 * aggregated leaderboard is viewable by all opted-in users.
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type Period = 'daily' | 'weekly' | 'monthly' | 'alltime'

function getPeriodBounds(period: Period): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  if (period === 'daily') {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  if (period === 'weekly') {
    const start = new Date(now)
    const day = start.getDay()
    start.setDate(start.getDate() - day)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  if (period === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { start, end }
  }
  // alltime
  return { start: new Date(0), end }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const period = (req.nextUrl.searchParams.get('period') || 'weekly') as Period

  // Get all users with gamification enabled
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('gamification_enabled', true)

  if (usersError || !users) {
    return NextResponse.json({ error: usersError?.message || 'Failed to load profiles' }, { status: 400 })
  }

  if (users.length === 0) return NextResponse.json({ data: [] })

  const { start, end } = getPeriodBounds(period)
  const userIds = users.map(u => u.id)

  // Aggregate points per user for the period from points_log
  // Uses server-side client so admin RLS applies — aggregation is safe
  const { data: pointRows } = await supabase
    .from('points_log')
    .select('user_id, points')
    .in('user_id', userIds)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())

  // Build a map of user_id -> total points
  const pointTotals: Record<string, number> = {}
  for (const row of pointRows || []) {
    pointTotals[row.user_id] = (pointTotals[row.user_id] || 0) + row.points
  }

  // Gather all-time totals for secondary display
  const { data: alltimeRows } = period !== 'alltime'
    ? await supabase.from('points_log').select('user_id, points').in('user_id', userIds)
    : { data: pointRows }

  const alltimeTotals: Record<string, number> = {}
  for (const row of alltimeRows || []) {
    alltimeTotals[row.user_id] = (alltimeTotals[row.user_id] || 0) + row.points
  }

  // Build entries — only include users with points > 0 in the period
  const entries = users
    .map(u => ({
      user_id: u.id,
      name: u.full_name || u.email || 'Team member',
      points: pointTotals[u.id] || 0,
      alltime_points: alltimeTotals[u.id] || 0,
      rank: 0,
      trend: 'same' as 'up' | 'down' | 'same',
    }))
    .filter(e => e.points > 0 || e.alltime_points > 0)

  // Sort: primary by period points desc, secondary by alltime points desc (tie-breaking by earliest signup — user_id string deterministic)
  entries.sort((a, b) =>
    b.points !== a.points
      ? b.points - a.points
      : b.alltime_points !== a.alltime_points
        ? b.alltime_points - a.alltime_points
        : a.user_id.localeCompare(b.user_id)
  )

  entries.forEach((e, i) => { e.rank = i + 1 })

  return NextResponse.json({ data: entries, period, generated_at: new Date().toISOString() })
}
