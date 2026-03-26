import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canReviewOperations } from '@/lib/roles'

// GET /api/daily-routines/team-health
// Restricted to officer, director, admin
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !canReviewOperations(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const today = new Date().toISOString().slice(0, 10)

  // Get all active team members
  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('status', 'active')

  // Get standup submissions for today
  const { data: standups } = await supabase
    .from('daily_entries')
    .select('user_id, created_at')
    .eq('type', 'standup')
    .eq('date', today)

  const standupMap = new Map<string, string>()
  standups?.forEach((s) => standupMap.set(s.user_id, s.created_at))

  // Get check-in submissions for today
  const { data: checkIns } = await supabase
    .from('daily_entries')
    .select('user_id, content')
    .eq('type', 'check_in')
    .eq('date', today)

  // Aggregate signals from check-in content
  let greenCount = 0
  let yellowCount = 0
  let redCount = 0

  checkIns?.forEach((ci) => {
    const entries = (ci.content as { entries?: Array<{ signal: string }> })?.entries ?? []
    entries.forEach((e) => {
      if (e.signal === 'green') greenCount++
      else if (e.signal === 'yellow') yellowCount++
      else if (e.signal === 'red') redCount++
    })
  })

  // Get blocked tasks (tasks with status = 'blocked')
  const { data: blockedTasks } = await supabase
    .from('tasks')
    .select('id, type, assigned_to, status')
    .eq('status', 'blocked')

  // Build members status list
  const totalMembers = teamMembers?.length ?? 0
  const submittedCount = standupMap.size
  const completionPct = totalMembers > 0 ? (submittedCount / totalMembers) * 100 : 0

  const members = (teamMembers ?? []).map((m) => {
    const submittedAt = standupMap.get(m.id)
    return {
      user_id: m.id,
      name: m.full_name ?? m.id,
      submitted_standup: Boolean(submittedAt),
      submitted_at: submittedAt ?? null,
      pending: !submittedAt,
    }
  })

  return NextResponse.json({
    standup_completion: {
      submitted: submittedCount,
      total: totalMembers,
      percentage: Math.round(completionPct),
      warning: completionPct < 75,
    },
    check_in_signals: {
      green: greenCount,
      yellow: yellowCount,
      red: redCount,
    },
    blocked_tasks: (blockedTasks ?? []).map((t) => ({
      id: t.id,
      title: t.type,
      assigned_to: t.assigned_to,
    })),
    members,
    timestamp: new Date().toISOString(),
  })
}
