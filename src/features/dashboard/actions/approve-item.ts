'use server'

import { createClient } from '@/lib/supabase/server'
import { validateApprovalDecision } from '@/features/approvals/approval-queue'

export interface ApproveItemInput {
  approvalQueueId: string
  decision: 'approved' | 'rejected'
  notes: string
  reviewedBy: string
}

export interface ApproveItemResult {
  success: boolean
  error?: string
  approvalId?: string
  decisionAt?: string
}

export async function approveItem(
  input: ApproveItemInput,
): Promise<ApproveItemResult> {
  const validationErrors = validateApprovalDecision(input.decision, input.notes)
  if (validationErrors.length > 0) {
    return { success: false, error: validationErrors.join(' ') }
  }

  if (input.notes.length > 500) {
    return {
      success: false,
      error: 'Notes must be 500 characters or fewer.',
    }
  }

  const supabase = await createClient()

  // Verify the item exists and is still awaiting review
  const { data: existing, error: fetchError } = await supabase
    .from('approval_queue')
    .select('id, status, workflow_run_id')
    .eq('id', input.approvalQueueId)
    .single()

  if (fetchError || !existing) {
    return { success: false, error: 'Approval item not found.' }
  }

  if (existing.status !== 'awaiting_review') {
    return {
      success: false,
      error: `Item is no longer awaiting review (current status: ${existing.status}).`,
    }
  }

  const decisionAt = new Date().toISOString()

  // Update the approval_queue record
  const { error: updateError } = await supabase
    .from('approval_queue')
    .update({
      status: input.decision,
      decision: input.decision,
      notes: input.notes || null,
      reviewed_by: input.reviewedBy,
      decision_at: decisionAt,
      updated_at: decisionAt,
    })
    .eq('id', input.approvalQueueId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // Insert audit_log entry for every decision
  await supabase.from('audit_log').insert({
    event: 'approval_decided',
    entity_type: 'approval_queue',
    entity_id: input.approvalQueueId,
    actor_type: 'human',
    actor_ref: input.reviewedBy,
    data: {
      approval_queue_id: input.approvalQueueId,
      decision: input.decision,
      notes: input.notes || null,
    },
    workflow_run_id: existing.workflow_run_id ?? undefined,
  })

  // If rejected, halt the associated workflow run
  if (input.decision === 'rejected' && existing.workflow_run_id) {
    await supabase
      .from('workflow_runs')
      .update({
        status: 'failed',
        updated_at: decisionAt,
      })
      .eq('id', existing.workflow_run_id)
  }

  return {
    success: true,
    approvalId: input.approvalQueueId,
    decisionAt,
  }
}
