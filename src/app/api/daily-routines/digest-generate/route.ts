import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/roles'

// POST /api/daily-routines/digest-generate
// Triggers digest generation (manual trigger for test/admin) OR called by pg_cron stub.
// digest is inserted into approval_queue with status='awaiting_review'.
// NO auto-send path. Distribution requires explicit human approval.
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Check if this is an internal pg_cron call (no auth) or a manual admin trigger
  const authHeader = req.headers.get('Authorization')
  const isCronCall = authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`

  let userId: string | null = null

  if (!isCronCall) {
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

    if (!profile || !isAdmin(profile.role)) {
      return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 })
    }

    userId = user.id
  }

  const today = new Date().toISOString().slice(0, 10)

  // Get daily routines config
  const { data: config } = await supabase
    .from('daily_routines_config')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (config && !config.digest_enabled) {
    return NextResponse.json({ message: 'Digest generation disabled' }, { status: 200 })
  }

  // Gather standup context
  const { data: standups } = await supabase
    .from('daily_entries')
    .select('id, user_id, content, profiles(full_name)')
    .eq('type', 'standup')
    .eq('date', today)

  // Gather check-in context
  const { data: checkIns } = await supabase
    .from('daily_entries')
    .select('id, user_id, content')
    .eq('type', 'check_in')
    .eq('date', today)

  // Gather shared gratitude
  const { data: gratitudeEntries } = await supabase
    .from('daily_entries')
    .select('id, user_id, content, profiles(full_name)')
    .eq('type', 'gratitude')
    .eq('date', today)
    .eq('is_public', true)

  // Gather completed tasks for today
  const { data: completedTasks } = await supabase
    .from('tasks')
    .select('id, type, completed_at')
    .eq('status', 'complete')
    .gte('completed_at', `${today}T00:00:00Z`)
    .lte('completed_at', `${today}T23:59:59Z`)

  // Format context for agent
  const formattedStandups = (standups ?? []).map((s) => {
    const profile = s.profiles as { full_name?: string | null } | null
    const c = s.content as { yesterday?: string; today?: string; blockers?: string }
    return {
      user: profile?.full_name ?? 'Team Member',
      yesterday: c.yesterday ?? '',
      today: c.today ?? '',
      blockers: c.blockers ?? '',
    }
  })

  const signalCounts = { green: 0, yellow: 0, red: 0 }
  ;(checkIns ?? []).forEach((ci) => {
    const entries = (ci.content as { entries?: Array<{ signal: string }> })?.entries ?? []
    entries.forEach((e) => {
      if (e.signal === 'green') signalCounts.green++
      else if (e.signal === 'yellow') signalCounts.yellow++
      else if (e.signal === 'red') signalCounts.red++
    })
  })

  const formattedGratitude = (gratitudeEntries ?? []).map((g) => {
    const profile = g.profiles as { full_name?: string | null } | null
    const c = g.content as { text?: string }
    return {
      user: profile?.full_name ?? 'Team Member',
      text: c.text ?? '',
    }
  })

  const context = {
    date: today,
    standups: formattedStandups,
    completedTasksCount: completedTasks?.length ?? 0,
    checkInSignals: signalCounts,
    sharedGratitude: formattedGratitude,
  }

  // Attempt OpenClaw call for digest generation
  let digestMarkdown = ''
  const openclawUrl = process.env.OPENCLAW_GATEWAY_URL ?? process.env.OPENCLAW_INTERNAL_URL
  const openclawToken = process.env.OPENCLAW_GATEWAY_TOKEN

  if (openclawUrl && openclawToken) {
    try {
      const openclawRes = await fetch(`${openclawUrl}/run-workflow`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openclawToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_id: 'daily-digest-generator',
          inputs: {
            date: today,
            context: JSON.stringify(context),
          },
        }),
      })

      if (openclawRes.ok) {
        const result = (await openclawRes.json()) as { outputs?: { digest_markdown?: string } }
        digestMarkdown =
          result.outputs?.digest_markdown ?? `# Daily Digest — ${today}\n\nNo data available.`
      } else {
        throw new Error('OpenClaw returned non-200')
      }
    } catch {
      // Fallback: generate minimal digest from gathered context
      digestMarkdown = buildFallbackDigest(today, context)
    }
  } else {
    // No OpenClaw configured — build fallback digest
    digestMarkdown = buildFallbackDigest(today, context)
  }

  // Insert into approval_queue — AWAITING_REVIEW. No auto-send.
  const channel = config?.digest_channel_discord ?? config?.digest_channel_teams ?? null
  const { data: approval, error: approvalError } = await supabase
    .from('approval_queue')
    .insert({
      gate_type: 'outbound-message',
      source_type: 'daily_digest',
      source_ref: `daily-digest-${today}`,
      status: 'awaiting_review',
      content: {
        type: 'daily_digest',
        markdown: digestMarkdown,
        date: today,
        channel,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (approvalError) {
    return NextResponse.json({ error: approvalError.message }, { status: 500 })
  }

  // Audit log
  await supabase.from('audit_log').insert({
    entity_type: 'approval_queue',
    entity_id: approval.id,
    actor_type: 'system',
    actor_ref: userId ?? 'pg_cron',
    event: 'daily_digest:generated',
    data: { approval_queue_id: approval.id, date: today },
  })

  return NextResponse.json({
    success: true,
    approval_queue_id: approval.id,
    digest_preview: digestMarkdown.slice(0, 500),
    message: 'Digest generated and queued for approval. No message will be sent until approved.',
  })
}

function buildFallbackDigest(
  date: string,
  context: {
    standups: Array<{ user: string; yesterday: string; today: string; blockers: string }>
    completedTasksCount: number
    checkInSignals: { green: number; yellow: number; red: number }
    sharedGratitude: Array<{ user: string; text: string }>
  },
): string {
  const lines: string[] = [`# Daily Digest — ${date}`, '']

  if (context.standups.length > 0) {
    lines.push('## Team Standups')
    context.standups.forEach((s) => {
      lines.push(`**${s.user}**: ${s.today || s.yesterday || '—'}`)
      if (s.blockers) lines.push(`  _Blockers: ${s.blockers}_`)
    })
    lines.push('')
  }

  lines.push('## Team Health')
  lines.push(
    `🟢 ${context.checkInSignals.green} On Track · 🟡 ${context.checkInSignals.yellow} Needs Attention · 🔴 ${context.checkInSignals.red} Blocked`,
  )
  lines.push('')

  if (context.completedTasksCount > 0) {
    lines.push(`## Completed Tasks`)
    lines.push(`${context.completedTasksCount} task(s) completed today.`)
    lines.push('')
  }

  if (context.sharedGratitude.length > 0) {
    lines.push('## Highlights')
    context.sharedGratitude.forEach((g) => {
      lines.push(`💚 **${g.user}**: ${g.text}`)
    })
    lines.push('')
  }

  return lines.join('\n')
}
