/**
 * Hub API — typed stubs for Edge Function calls.
 * The Hub is READ-ONLY for direct DB writes; all mutations go through Edge Functions.
 */

export interface CreateTaskPayload {
  workflowId: string
  title: string
  description: string
  priority: number
  triggerImmediately: boolean
}

export interface CreateTaskResponse {
  taskId: string
  status: string
  createdAt: string
  message: string
}

export interface TriggerWorkflowPayload {
  workflowId: string
  parameters: Record<string, unknown>
}

export interface TriggerWorkflowResponse {
  workflowRunId: string
  status: string
  triggeredAt: string
  message: string
}

export class HubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'HubApiError'
  }
}

/**
 * POST /functions/v1/create-task
 * Creates a new task via Edge Function. Hub is read-only for direct DB writes.
 */
export async function createTask(payload: CreateTaskPayload): Promise<CreateTaskResponse> {
  const res = await fetch('/functions/v1/create-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string }
    throw new HubApiError(body.message ?? 'Failed to create task', res.status)
  }

  return res.json() as Promise<CreateTaskResponse>
}

/**
 * POST /functions/v1/trigger-workflow
 * Triggers an existing workflow run via Edge Function.
 */
export async function triggerWorkflow(
  payload: TriggerWorkflowPayload,
): Promise<TriggerWorkflowResponse> {
  const res = await fetch('/functions/v1/trigger-workflow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string }
    throw new HubApiError(body.message ?? 'Failed to trigger workflow', res.status)
  }

  return res.json() as Promise<TriggerWorkflowResponse>
}
