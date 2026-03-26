import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/types'
import type { Json } from '@/types/database'
import { getWorkflowList, getWorkflowEditorData } from '@/features/workflows/queries'

export { type WorkflowListItem } from '@/features/workflows/queries'

export async function getWorkflows(
  supabase: SupabaseClient<Database>,
) {
  return getWorkflowList(supabase)
}

export async function getWorkflowWithNodes(
  supabase: SupabaseClient<Database>,
  workflowId: string,
) {
  return getWorkflowEditorData(supabase, workflowId)
}

export async function createWorkflowRun(
  supabase: SupabaseClient<Database>,
  data: {
    workflowId: string
    workflowVersionId: string
    departmentId: string
    projectId?: string
    initiatedBy: string
    triggerType?: string
    inputPayload?: Record<string, Json>
  },
): Promise<{ id: string } | { error: string }> {
  const { data: run, error } = await supabase
    .from('workflow_runs')
    .insert({
      workflow_id: data.workflowId,
      workflow_version_id: data.workflowVersionId,
      department_id: data.departmentId,
      project_id: data.projectId ?? null,
      initiated_by: data.initiatedBy,
      trigger_type: data.triggerType ?? 'manual',
      input_payload: (data.inputPayload ?? {}) as Json,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: run.id }
}

export async function getWorkflowRuns(
  supabase: SupabaseClient<Database>,
  departmentId: string,
  options?: { workflowId?: string; status?: string; limit?: number },
): Promise<Tables<'workflow_runs'>[]> {
  let query = supabase
    .from('workflow_runs')
    .select('*')
    .eq('department_id', departmentId)
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 20)

  if (options?.workflowId) {
    query = query.eq('workflow_id', options.workflowId)
  }
  if (options?.status) {
    query = query.eq('status', options.status)
  }

  const { data } = await query
  return data ?? []
}
