import type { Json } from '@/types/database'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateApprovalDecision } from '@/features/approvals/approval-queue'
import { canAccessAdminSurface, type StoredRole } from '@/lib/roles'

export async function applyApprovalDecision(input: {
  approvalId: string
  decision: 'approved' | 'rejected'
  notes: string
  userId: string
  userRole?: StoredRole
}) {
  const validationErrors = validateApprovalDecision(input.decision, input.notes)
  if (validationErrors.length > 0) {
    return { error: validationErrors }
  }

  const supabase = createAdminClient()
  const { data: item, error: itemError } = await supabase
    .from('approval_queue')
    .select('*')
    .eq('id', input.approvalId)
    .single()

  if (itemError || !item) {
    return { error: ['Approval item not found.'] }
  }

  const isAdmin = canAccessAdminSurface(input.userRole)
  const canReview = isAdmin || item.assigned_reviewer_id === input.userId

  if (!canReview) {
    return { error: ['You are not assigned to review this item.'] }
  }

  if (item.submitted_by === input.userId) {
    return { error: ['You cannot approve your own submission.'] }
  }

  if (item.status !== 'awaiting_review') {
    return { error: [`Item is already ${item.status}.`] }
  }

  const nowIso = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('approval_queue')
    .update({
      status: input.decision,
      decision: input.decision,
      reviewed_by: input.userId,
      notes: input.notes.trim() || null,
      decision_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', input.approvalId)

  if (updateError) {
    return { error: [updateError.message] }
  }

  if (input.decision === 'approved' && item.workflow_run_id) {
    await supabase
      .from('workflow_run_steps')
      .update({ status: 'ready', updated_at: nowIso })
      .eq('workflow_run_id', item.workflow_run_id)
      .eq('status', 'awaiting_approval')

    await supabase
      .from('workflow_runs')
      .update({ status: 'running', updated_at: nowIso })
      .eq('id', item.workflow_run_id)
      .eq('status', 'awaiting_approval')
  }

  await supabase.from('audit_log').insert({
    entity_type: 'approval_queue',
    entity_id: input.approvalId,
    workflow_run_id: item.workflow_run_id ?? null,
    actor_type: 'human',
    actor_ref: input.userId,
    event: input.decision === 'approved' ? 'approval:approved' : 'approval:rejected',
    data: {
      gate_type: item.gate_type,
      source_type: item.source_type,
      notes: input.notes.trim() || null,
    } as unknown as Json,
  })

  return { success: true }
}

export async function applyHumanInputDecision(input: {
  approvalId: string
  fields: Record<string, unknown>
  userId: string
  userRole?: StoredRole
}) {
  const supabase = createAdminClient()
  const { data: item, error: itemError } = await supabase
    .from('approval_queue')
    .select('*')
    .eq('id', input.approvalId)
    .single()

  if (itemError || !item) {
    return { error: ['Approval item not found.'] }
  }

  const isAdmin = canAccessAdminSurface(input.userRole)
  const canReview = isAdmin || item.assigned_reviewer_id === input.userId

  if (!canReview) {
    return { error: ['You are not assigned to review this item.'] }
  }

  if (item.status !== 'awaiting_review') {
    return { error: [`Item is already ${item.status}.`] }
  }

  const nowIso = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('approval_queue')
    .update({
      status: 'approved',
      decision: 'approved',
      reviewed_by: input.userId,
      notes: JSON.stringify(input.fields),
      decision_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', input.approvalId)

  if (updateError) {
    return { error: [updateError.message] }
  }

  if (item.workflow_run_id) {
    await supabase
      .from('workflow_run_steps')
      .update({ status: 'ready', updated_at: nowIso })
      .eq('workflow_run_id', item.workflow_run_id)
      .eq('status', 'awaiting_approval')

    await supabase
      .from('workflow_runs')
      .update({ status: 'running', updated_at: nowIso })
      .eq('id', item.workflow_run_id)
      .eq('status', 'awaiting_approval')
  }

  await supabase.from('audit_log').insert({
    entity_type: 'approval_queue',
    entity_id: input.approvalId,
    workflow_run_id: item.workflow_run_id ?? null,
    actor_type: 'human',
    actor_ref: input.userId,
    event: 'human-input:submitted',
    data: {
      gate_type: item.gate_type,
      fields: input.fields,
    } as unknown as Json,
  })

  return { success: true }
}

export async function applyResultFeedback(input: {
  approvalId: string
  rating: 1 | 2 | 3 | 4 | 5
  notes: string
  userId: string
  userRole?: StoredRole
}) {
  const supabase = createAdminClient()
  const { data: item, error: itemError } = await supabase
    .from('approval_queue')
    .select('*')
    .eq('id', input.approvalId)
    .single()

  if (itemError || !item) {
    return { error: ['Approval item not found.'] }
  }

  const isAdmin = canAccessAdminSurface(input.userRole)
  const canReview = isAdmin || item.assigned_reviewer_id === input.userId

  if (!canReview) {
    return { error: ['You are not assigned to review this item.'] }
  }

  if (item.status !== 'awaiting_review') {
    return { error: [`Item is already ${item.status}.`] }
  }

  const nowIso = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('approval_queue')
    .update({
      status: 'approved',
      decision: 'approved',
      reviewed_by: input.userId,
      notes: input.notes.trim() || null,
      decision_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', input.approvalId)

  if (updateError) {
    return { error: [updateError.message] }
  }

  if (item.workflow_run_id) {
    await supabase
      .from('workflow_run_steps')
      .update({ status: 'ready', updated_at: nowIso })
      .eq('workflow_run_id', item.workflow_run_id)
      .eq('status', 'awaiting_approval')

    await supabase
      .from('workflow_runs')
      .update({ status: 'running', updated_at: nowIso })
      .eq('id', item.workflow_run_id)
      .eq('status', 'awaiting_approval')
  }

  await supabase.from('audit_log').insert({
    entity_type: 'approval_queue',
    entity_id: input.approvalId,
    workflow_run_id: item.workflow_run_id ?? null,
    actor_type: 'human',
    actor_ref: input.userId,
    event: 'feedback:submitted',
    data: {
      gate_type: item.gate_type,
      rating: input.rating,
      notes: input.notes.trim() || null,
    } as unknown as Json,
  })

  return { success: true }
}
