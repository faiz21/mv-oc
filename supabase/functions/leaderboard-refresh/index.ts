import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

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

Deno.serve(async (_req: Request) => {
  try {
    const periods: Period[] = ['daily', 'weekly', 'monthly', 'alltime']

    for (const period of periods) {
      const { start, end } = getPeriodBounds(period)

      // Get all users with gamification enabled
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('gamification_enabled', true)

      if (!users) continue

      // Calculate points for each user
      const entries = []
      for (const user of users) {
        const { data: points } = await supabase
          .from('points_log')
          .select('points')
          .eq('user_id', user.id)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())

        const totalPoints = points?.reduce((sum, p) => sum + p.points, 0) || 0
        if (totalPoints > 0) {
          entries.push({
            user_id: user.id,
            name: user.full_name || 'Anonymous',
            avatar_url: user.avatar_url || null,
            points: totalPoints,
            rank: 0,
            trend: 'same',
          })
        }
      }

      // Sort by points, assign ranks
      entries.sort((a, b) => b.points - a.points || a.user_id.localeCompare(b.user_id))
      entries.forEach((e, i) => { e.rank = i + 1 })

      // SCHEMA FLAG: leaderboard_snapshots table not yet in DB types (T-08-01 pending migration).
      // This insert is a no-op until migration runs. The API route at /api/gaming/leaderboard
      // aggregates live from points_log as fallback.
      await supabase.from('leaderboard_snapshots' as 'system_state').insert({
        period,
        period_start: start.toISOString(),
        period_end: end.toISOString(),
        data: entries,
        generated_at: new Date().toISOString(),
      })
    }

    return new Response(JSON.stringify({ success: true, refreshed_at: new Date().toISOString() }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('leaderboard-refresh error:', error)
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
})
