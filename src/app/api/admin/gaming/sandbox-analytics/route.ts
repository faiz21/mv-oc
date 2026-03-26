/**
 * Admin API — Sandbox Analytics (T-08-18)
 *
 * Returns aggregated analytics for sandbox_runs.
 * Admin-only. Supports date range and period filters.
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
  return profile?.role === 'admin'
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await requireAdmin(supabase, user.id)) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || 'week' // week | month | alltime

  const now = new Date()
  let periodStart: Date
  if (period === 'week') {
    periodStart = new Date(now)
    periodStart.setDate(now.getDate() - 7)
  } else if (period === 'month') {
    periodStart = new Date(now)
    periodStart.setDate(now.getDate() - 30)
  } else {
    periodStart = new Date(0)
  }

  const periodStartISO = periodStart.toISOString()

  // Fetch all sandbox runs in period
  const { data: runsInPeriod } = await supabase
    .from('sandbox_runs')
    .select('id, user_id, workflow_id, status, execution_time_ms, error, created_at')
    .gte('created_at', periodStartISO)
    .order('created_at', { ascending: false })

  // Fetch all-time count
  const { count: alltimeCount } = await supabase
    .from('sandbox_runs')
    .select('id', { count: 'exact', head: true })

  // Previous period for trend calculation
  const prevPeriodStart = new Date(periodStart)
  const periodLengthMs = now.getTime() - periodStart.getTime()
  prevPeriodStart.setTime(periodStart.getTime() - periodLengthMs)

  const { count: prevCount } = await supabase
    .from('sandbox_runs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', prevPeriodStart.toISOString())
    .lt('created_at', periodStartISO)

  const runs = runsInPeriod || []
  const totalRuns = runs.length
  const successRuns = runs.filter(r => r.status === 'complete').length
  const failedRuns = runs.filter(r => r.status === 'failed').length

  const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0

  // Average execution time (only completed runs)
  const completedTimes = runs.filter(r => r.execution_time_ms && r.status === 'complete').map(r => r.execution_time_ms as number)
  const avgExecutionMs = completedTimes.length > 0
    ? Math.round(completedTimes.reduce((a, b) => a + b, 0) / completedTimes.length)
    : 0

  // Breakdown by workflow
  const workflowCounts: Record<string, number> = {}
  for (const run of runs) {
    const wid = run.workflow_id || 'unknown'
    workflowCounts[wid] = (workflowCounts[wid] || 0) + 1
  }

  // Fetch workflow names for display
  const workflowIds = Object.keys(workflowCounts).filter(id => id !== 'unknown')
  let workflowNames: Record<string, string> = {}
  if (workflowIds.length > 0) {
    const { data: workflows } = await supabase
      .from('workflows')
      .select('id, name')
      .in('id', workflowIds)
    for (const wf of (workflows || [])) {
      workflowNames[wf.id] = wf.name
    }
  }

  const byWorkflow = Object.entries(workflowCounts).map(([wid, count]) => ({
    workflow_id: wid,
    name: workflowNames[wid] || wid,
    count,
  })).sort((a, b) => b.count - a.count)

  // Breakdown by user
  const userCounts: Record<string, number> = {}
  for (const run of runs) {
    const uid = run.user_id || 'unknown'
    userCounts[uid] = (userCounts[uid] || 0) + 1
  }

  const userIds = Object.keys(userCounts).filter(id => id !== 'unknown')
  let userNames: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)
    for (const p of (profiles || [])) {
      userNames[p.id] = p.full_name || 'Unknown'
    }
  }

  const byUser = Object.entries(userCounts).map(([uid, count]) => ({
    user_id: uid,
    name: userNames[uid] || uid,
    count,
  })).sort((a, b) => b.count - a.count)

  // Most common errors
  const errorCounts: Record<string, number> = {}
  for (const run of runs.filter(r => r.status === 'failed' && r.error)) {
    const errKey = (run.error as string).substring(0, 80)
    errorCounts[errKey] = (errorCounts[errKey] || 0) + 1
  }

  const topErrors = Object.entries(errorCounts).map(([msg, count]) => ({ msg, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Trend
  const prevCountNum = prevCount ?? 0
  let trend = 'stable'
  if (prevCountNum > 0) {
    const changePercent = ((totalRuns - prevCountNum) / prevCountNum) * 100
    if (changePercent >= 10) trend = `up ${Math.round(changePercent)}%`
    else if (changePercent <= -10) trend = `down ${Math.abs(Math.round(changePercent))}%`
  } else if (totalRuns > 0) {
    trend = 'new activity'
  }

  return NextResponse.json({
    period,
    total_runs: totalRuns,
    alltime_runs: alltimeCount ?? 0,
    success_runs: successRuns,
    failed_runs: failedRuns,
    success_rate: successRate,
    avg_execution_ms: avgExecutionMs,
    trend,
    by_workflow: byWorkflow,
    by_user: byUser,
    top_errors: topErrors,
  })
}
