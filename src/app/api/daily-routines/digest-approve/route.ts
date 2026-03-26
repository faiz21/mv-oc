import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canReviewOperations } from '@/lib/roles'

// POST /api/daily-routines/digest-approve
// Body: { approval_queue_id: string, decision: 'approved'|'rejected', notes?: string }
// Restricted to officer, director, admin.
// On approval: triggers distribution via OpenClaw /send-message.
// Rejection requires notes. No digest is ever sent without decision='approved'.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || !canReviewOperations(profile.role)) {
    return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 })
  }

  let body: { approval_queue_id?: string; decision?: string; notes?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { approval_queue_id, decision, notes } = body

  if (!approval_queue_id || !decision) {
    return NextResponse.json(
      { error: 'approval_queue_id and decision are required' },
      { status: 400 },
    )
  }

  if (!['approved', 'rejected'].includes(decision)) {
    return NextResponse.json(
      { error: 'Decision must be approved or rejected' },
      { status: 400 },
    )
  }

  // Rejection requires notes
  if (decision === 'rejected' && (!notes || notes.trim().length === 0)) {
    return NextResponse.json(
      { error: 'Rejection requires a reason in notes' },
      { status: 400 },
    )
  }

  // Fetch the approval queue row
  const { data: approvalRow, error: fetchError } = await supabase
    .from('approval_queue')
    .select('*')
    .eq('id', approval_queue_id)
    .eq('gate_type', 'outbound-message')
    .single()

  if (fetchError || !approvalRow) {
    return NextResponse.json({ error: 'Approval queue item not found' }, { status: 404 })
  }

  if (approvalRow.decision !== null) {
    return NextResponse.json(
      { error: 'This digest has already been reviewed' },
      { status: 409 },
    )
  }

  const now = new Date().toISOString()

  // Update approval_queue row
  const { error: updateError } = await supabase
    .from('approval_queue')
    .update({
      decision,
      reviewed_by: user.id,
      decision_at: now,
      notes: notes ?? null,
      status: decision === 'approved' ? 'approved' : 'rejected',
      updated_at: now,
    })
    .eq('id', approval_queue_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Audit log entry
  await supabase.from('audit_log').insert({
    entity_type: 'approval_queue',
    entity_id: approval_queue_id,
    actor_type: 'human',
    actor_ref: user.id,
    event: decision === 'approved' ? 'daily_digest:approved' : 'daily_digest:rejected',
    data: {
      approval_queue_id,
      decision,
      notes: notes ?? null,
      reviewer: profile.full_name ?? user.id,
    },
  })

  // If approved: trigger distribution via OpenClaw (fire-and-forget)
  if (decision === 'approved') {
    const digestContent = approvalRow.content as {
      markdown?: string
      channel?: string | null
      date?: string
    }

    const channel = digestContent.channel
    const markdown = digestContent.markdown ?? ''
    const approverName = profile.full_name ?? user.id

    // Attempt distribution — errors do not block the approval response
    try {
      const openclawUrl = process.env.OPENCLAW_GATEWAY_URL ?? process.env.OPENCLAW_INTERNAL_URL
      const openclawToken = process.env.OPENCLAW_GATEWAY_TOKEN

      if (openclawUrl && openclawToken && channel) {
        await fetch(`${openclawUrl}/send-message`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openclawToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channel,
            content: `${markdown}\n\n_Digest approved by ${approverName} at ${now}_`,
            source: 'system',
          }),
        })

        // Audit distribution
        await supabase.from('audit_log').insert({
          entity_type: 'approval_queue',
          entity_id: approval_queue_id,
          actor_type: 'system',
          actor_ref: 'orchestrator',
          event: 'daily_digest:distributed',
          data: { approval_queue_id, channel },
        })
      }
    } catch {
      // Distribution failure is non-fatal; approval is still recorded
    }
  }

  return NextResponse.json({
    success: true,
    message:
      decision === 'approved'
        ? 'Digest approved and queued for distribution.'
        : 'Digest rejected. No message will be sent.',
  })
}
