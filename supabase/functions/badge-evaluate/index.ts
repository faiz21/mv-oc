import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface BadgeCriteria {
  type: string
  threshold?: number
  count?: number
  period?: string
  days?: number
}

async function evaluateCriteria(userId: string, criteria: BadgeCriteria): Promise<boolean> {
  switch (criteria.type) {
    case 'cumulative_points': {
      // Sum points_log directly — no RPC dependency
      const { data: rows } = await supabase
        .from('points_log')
        .select('points')
        .eq('user_id', userId)
      const total = rows?.reduce((s, r) => s + r.points, 0) ?? 0
      return total >= (criteria.threshold || 0)
    }
    case 'task_count': {
      const period = criteria.period || 'alltime'
      let query = supabase.from('tasks').select('id', { count: 'exact' }).eq('assigned_to', userId).eq('status', 'complete')
      if (period === 'monthly') query = query.gte('updated_at', new Date(new Date().setDate(1)).toISOString())
      if (period === 'weekly') query = query.gte('updated_at', new Date(Date.now() - 7 * 86400000).toISOString())
      const { count } = await query
      return (count || 0) >= (criteria.count || 0)
    }
    case 'standup_streak': {
      // Count consecutive standup days from points_log
      const { data: standupRows } = await supabase
        .from('points_log')
        .select('created_at')
        .eq('user_id', userId)
        .in('action_type', ['standup_submitted_ontime', 'standup_submitted_late'])
        .order('created_at', { ascending: false })

      if (!standupRows || standupRows.length === 0) return false

      // Calculate consecutive day streak
      let streak = 0
      let prev: Date | null = null
      for (const row of standupRows) {
        const day = new Date(row.created_at)
        day.setHours(0, 0, 0, 0)
        if (!prev) {
          streak = 1
          prev = day
        } else {
          const diff = (prev.getTime() - day.getTime()) / 86400000
          if (diff === 1) { streak++; prev = day }
          else if (diff > 1) break
        }
      }
      return streak >= (criteria.days || 0)
    }
    case 'approval_count_fast': {
      const { count } = await supabase
        .from('points_log')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('action_type', 'approval_reviewed_fast')
      return (count || 0) >= (criteria.count || 0)
    }
    case 'incident_response_fast': {
      const { count } = await supabase
        .from('points_log')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('action_type', 'incident_high_severity')
      return (count || 0) >= (criteria.count || 0)
    }
    case 'workflow_created': {
      const { count } = await supabase
        .from('workflows')
        .select('id', { count: 'exact' })
        .eq('created_by', userId)
        .eq('status', 'active')
      return (count || 0) >= (criteria.count || 0)
    }
    default:
      return false
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { user_id } = await req.json()
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Fetch all enabled badges
    const { data: badges } = await supabase.from('badges').select('*').eq('enabled', true)
    if (!badges) return new Response(JSON.stringify({ success: true, newly_awarded: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })

    // Fetch badges user already has (canonical table: badges_earned)
    const { data: existingBadges } = await supabase
      .from('badges_earned')
      .select('badge_id, awarded_at')
      .eq('user_id', user_id)

    const newlyAwarded: string[] = []

    for (const badge of badges) {
      // badges table in DB uses unlock_condition text, not jsonb criteria
      // Parse criteria from unlock_condition if stored as JSON string, else skip
      let criteria: BadgeCriteria
      try {
        criteria = typeof badge.unlock_condition === 'string'
          ? JSON.parse(badge.unlock_condition)
          : badge.unlock_condition
      } catch {
        console.warn(`Badge ${badge.id} has non-JSON unlock_condition, skipping`)
        continue
      }

      const qualifies = await evaluateCriteria(user_id, criteria)

      if (!qualifies) continue

      // For most badges, only award once (check if already has it)
      const alreadyHas = existingBadges?.some(eb => eb.badge_id === badge.id)

      // standup_streak badges can be re-earned
      const canReEarn = criteria.type === 'standup_streak'

      if (alreadyHas && !canReEarn) continue

      // Award the badge (badges_earned is the canonical join table)
      const { error } = await supabase.from('badges_earned').insert({
        user_id,
        badge_id: badge.id,
        is_active: true,
      })

      if (!error) {
        newlyAwarded.push(badge.id)

        // Broadcast badge award — use fields that exist in the actual badges table
        await supabase.channel('gaming:badges').send({
          type: 'broadcast',
          event: 'badge_awarded',
          payload: {
            user_id,
            badge_id: badge.id,
            badge_name: badge.name,
            badge_icon: badge.icon_url || null,
            rarity: badge.rarity,
            timestamp: new Date().toISOString(),
          }
        })
      }
    }

    return new Response(JSON.stringify({
      success: true,
      badges: badges.map(b => b.id),
      newly_awarded: newlyAwarded,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('badge-evaluate error:', error)
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
})
