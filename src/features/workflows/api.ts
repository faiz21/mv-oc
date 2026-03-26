/**
 * API stubs for Workflow Builder Edge Functions.
 * Each function calls the expected endpoint and returns typed responses.
 * Backend Edge Functions are not yet deployed — these stubs handle
 * request construction, error wrapping, and response typing.
 */

import type {
  WorkflowEditorDocument,
  WorkflowVersionSummary,
  WorkflowStatus,
} from '@/features/workflows/editor-model'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

interface ApiSuccess<T> {
  ok: true
  data: T
}

interface ApiError {
  ok: false
  errors: string[]
}

type ApiResult<T> = ApiSuccess<T> | ApiError

async function apiFetch<T>(url: string, options: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    const body = await response.json() as Record<string, unknown>
    if (!response.ok) {
      const errors = Array.isArray(body.errors) ? body.errors as string[] : [String(body.message ?? 'Request failed')]
      return { ok: false, errors }
    }
    return { ok: true, data: body as T }
  } catch {
    return { ok: false, errors: ['Network error — could not reach the server.'] }
  }
}

// ---------------------------------------------------------------------------
// Response interfaces
// ---------------------------------------------------------------------------

export interface SaveDraftResponse {
  workflowId: string
  versionId: string
  versionNumber: number
}

export interface ActivateResponse {
  workflowId: string
  status: WorkflowStatus
  activatedAt: string
}

export interface DeactivateResponse {
  workflowId: string
  status: WorkflowStatus
  deactivatedAt: string
}

export interface VersionHistoryResponse {
  versions: WorkflowVersionSummary[]
}

export interface RestoreVersionResponse {
  workflowId: string
  newVersionId: string
  newVersionNumber: number
  changeSummary: string
}

export interface SandboxRunResponse {
  sandboxRunId: string
  predictedProgression: SandboxStepResult[]
  finalStatus: string
}

export interface SandboxStepResult {
  stepId: string
  stepName: string
  stepType: string
  status: 'completed' | 'awaiting_approval' | 'failed' | 'skipped'
  output: Record<string, unknown> | null
  error: string | null
}

export interface SandboxResultResponse {
  sandboxRunId: string
  workflowId: string
  status: string
  predictedProgression: SandboxStepResult[]
  createdAt: string
  expiresAt: string
}

export interface AIDraftResponse {
  workflowName: string
  description: string
  triggerType: string
  steps: Array<{
    name: string
    type: string
    config: Record<string, unknown>
  }>
}

export interface DeleteWorkflowResponse {
  workflowId: string
  deletedAt: string
}

export interface DuplicateWorkflowResponse {
  workflowId: string
  name: string
}

export interface AuditTrailEvent {
  id: string
  eventType: string
  actor: string
  timestamp: string
  changeDetails: Record<string, unknown> | null
}

export interface AuditTrailResponse {
  events: AuditTrailEvent[]
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/** Save a workflow draft. Creates a new version on the backend. */
export function saveWorkflowDraft(
  workflowId: string,
  document: WorkflowEditorDocument,
  changeSummary?: string,
): Promise<ApiResult<SaveDraftResponse>> {
  return apiFetch<SaveDraftResponse>(`/api/workflows/${workflowId}/save`, {
    method: 'POST',
    body: JSON.stringify({ document, changeSummary }),
  })
}

/** Create a brand-new workflow (no ID yet). */
export function createWorkflow(
  document: WorkflowEditorDocument,
  changeSummary?: string,
): Promise<ApiResult<SaveDraftResponse>> {
  return apiFetch<SaveDraftResponse>('/api/workflows', {
    method: 'POST',
    body: JSON.stringify({ document, changeSummary }),
  })
}

/** Activate a workflow — transitions status to 'active'. */
export function activateWorkflow(
  workflowId: string,
  versionId?: string,
): Promise<ApiResult<ActivateResponse>> {
  return apiFetch<ActivateResponse>(`/api/workflows/${workflowId}/activate`, {
    method: 'POST',
    body: JSON.stringify({ versionId }),
  })
}

/** Deactivate a workflow — transitions status to 'inactive'. */
export function deactivateWorkflow(
  workflowId: string,
): Promise<ApiResult<DeactivateResponse>> {
  return apiFetch<DeactivateResponse>(`/api/workflows/${workflowId}/deactivate`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

/** Get version history for a workflow. */
export function getVersionHistory(
  workflowId: string,
): Promise<ApiResult<VersionHistoryResponse>> {
  return apiFetch<VersionHistoryResponse>(`/api/workflows/${workflowId}/versions`, {
    method: 'GET',
  })
}

/** Restore a workflow to a previous version. */
export function restoreVersion(
  workflowId: string,
  versionId: string,
): Promise<ApiResult<RestoreVersionResponse>> {
  return apiFetch<RestoreVersionResponse>(`/api/workflows/${workflowId}/versions/${versionId}/restore`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

/** Execute a sandbox test run. */
export function runSandboxTest(
  workflowId: string,
  payload: Record<string, unknown>,
): Promise<ApiResult<SandboxRunResponse>> {
  return apiFetch<SandboxRunResponse>(`/api/workflows/${workflowId}/sandbox`, {
    method: 'POST',
    body: JSON.stringify({ payload }),
  })
}

/** Retrieve results of a sandbox run. */
export function getSandboxResult(
  sandboxRunId: string,
): Promise<ApiResult<SandboxResultResponse>> {
  return apiFetch<SandboxResultResponse>(`/api/sandbox/${sandboxRunId}`, {
    method: 'GET',
  })
}

/** Generate an AI draft from a natural language requirement. */
export function generateAIDraft(
  requirement: string,
): Promise<ApiResult<AIDraftResponse>> {
  return apiFetch<AIDraftResponse>('/api/workflows/ai-draft', {
    method: 'POST',
    body: JSON.stringify({ requirement }),
  })
}

/** Soft-delete a workflow. */
export function deleteWorkflow(
  workflowId: string,
): Promise<ApiResult<DeleteWorkflowResponse>> {
  return apiFetch<DeleteWorkflowResponse>(`/api/workflows/${workflowId}`, {
    method: 'DELETE',
  })
}

/** Duplicate a workflow. */
export function duplicateWorkflow(
  workflowId: string,
): Promise<ApiResult<DuplicateWorkflowResponse>> {
  return apiFetch<DuplicateWorkflowResponse>(`/api/workflows/${workflowId}/duplicate`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

/** Get audit trail for a workflow. */
export function getWorkflowAuditTrail(
  workflowId: string,
): Promise<ApiResult<AuditTrailResponse>> {
  return apiFetch<AuditTrailResponse>(`/api/workflows/${workflowId}/audit-trail`, {
    method: 'GET',
  })
}
