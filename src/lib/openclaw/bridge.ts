import { createClient } from '@/lib/supabase/client'

export async function dispatchTask(payload: {
  workflowRunId: string
  workflowRunStepId: string
  agentId: string
  taskType: string
  input: Record<string, unknown>
  departmentId: string
}): Promise<{ taskId: string } | { error: string }> {
  const supabase = createClient()

  const { data, error } = await supabase.functions.invoke('dispatch-task', {
    body: {
      workflow_run_id: payload.workflowRunId,
      workflow_run_step_id: payload.workflowRunStepId,
      agent_id: payload.agentId,
      task_type: payload.taskType,
      input: payload.input,
      department_id: payload.departmentId,
    },
  })

  if (error) return { error: error.message }
  return { taskId: data?.task_id }
}

export async function resumeWorkflow(payload: {
  approvalQueueId: string
  decision: 'approved' | 'rejected'
  notes?: string
  reviewerId: string
}): Promise<{ ok: boolean } | { error: string }> {
  const supabase = createClient()

  const { data, error } = await supabase.functions.invoke('resume-workflow', {
    body: {
      approval_queue_id: payload.approvalQueueId,
      decision: payload.decision,
      notes: payload.notes ?? '',
      reviewer_id: payload.reviewerId,
    },
  })

  if (error) return { error: error.message }
  return { ok: true }
}

export async function buildContextBundle(payload: {
  workflowRunId: string
  workflowRunStepId: string
  taskId: string
  agentId: string
}): Promise<{ contextPacketId: string } | { error: string }> {
  const supabase = createClient()

  const { data, error } = await supabase.functions.invoke('build-context-bundle', {
    body: {
      workflow_run_id: payload.workflowRunId,
      workflow_run_step_id: payload.workflowRunStepId,
      task_id: payload.taskId,
      agent_id: payload.agentId,
    },
  })

  if (error) return { error: error.message }
  return { contextPacketId: data?.context_packet_id }
}
