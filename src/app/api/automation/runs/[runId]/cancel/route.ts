import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { canReviewOperations } from '@/lib/roles'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params
  let reason: string | undefined
  try {
    const body = await request.json()
    reason = typeof body?.reason === 'string' ? body.reason : undefined
  } catch {
    // No body or non-JSON body — that's fine
  }

  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!canReviewOperations(profile?.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const nowIso = new Date().toISOString()
  await admin.from('workflow_runs').update({ status: 'cancelled', updated_at: nowIso }).eq('id', runId)
  await admin.from('workflow_run_steps').update({ status: 'cancelled', updated_at: nowIso }).eq('workflow_run_id', runId).in('status', ['pending', 'ready', 'running', 'blocked', 'awaiting_approval'])
  await admin.from('audit_log').insert({
    entity_type: 'workflow_run',
    entity_id: runId,
    workflow_run_id: runId,
    actor_type: 'human',
    actor_ref: user.id,
    event: 'automation:cancelled',
    data: reason ? { reason } : null,
  })

  return NextResponse.json({ ok: true, runId })
}
