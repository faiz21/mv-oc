import type { Database } from '@/types/database'
import { serializeWorkflowDocument, slugifyWorkflowKey, validateWorkflowDocument, type WorkflowEditorDocument } from '@/features/workflows/editor-model'

type DbClient = any

export interface WorkflowSaveResult {
  workflowId: string
  versionId: string
  versionNumber: number
  status: 'draft' | 'active' | 'inactive'
}

export async function createWorkflowRecord(
  supabase: DbClient,
  userId: string,
  document: WorkflowEditorDocument,
  changeSummary?: string,
) {
  const validation = validateWorkflowDocument(document)
  if (!validation.isValid) {
    return { error: validation.errors }
  }

  const serialized = serializeWorkflowDocument(document)
  const key = await ensureUniqueWorkflowKey(supabase, serialized.workflow.key || slugifyWorkflowKey(serialized.workflow.name))

  const workflowInsert = {
    ...serialized.workflow,
    key,
    status: 'draft' as const,
    created_by: userId,
    updated_by: userId,
  }

  const { data: workflow, error: workflowError } = await supabase
    .from('workflows')
    .insert(workflowInsert)
    .select('id, status')
    .single()

  if (workflowError || !workflow) {
    return { error: [workflowError?.message ?? 'Failed to create workflow.'] }
  }

  const versionResult = await insertWorkflowVersion(supabase, workflow.id, userId, document, changeSummary, workflow.status, 1)
  if ('error' in versionResult) {
    return versionResult
  }

  const { error: workflowUpdateError } = await supabase
    .from('workflows')
    .update({
      active_version_id: versionResult.versionId,
      updated_by: userId,
      key,
      name: document.settings.name,
      description: document.settings.description || null,
      primary_agent_id: document.settings.primaryAgentId,
      requires_approval: document.settings.requiresApproval,
      requires_approval_reason: document.settings.requiresApproval ? document.settings.requiresApprovalReason.trim() : null,
    })
    .eq('id', workflow.id)

  if (workflowUpdateError) {
    return { error: [workflowUpdateError.message] }
  }

  return versionResult
}

export async function saveWorkflowVersion(
  supabase: DbClient,
  userId: string,
  workflowId: string,
  document: WorkflowEditorDocument,
  changeSummary?: string,
) {
  const validation = validateWorkflowDocument(document)
  if (!validation.isValid) {
    return { error: validation.errors }
  }

  const { data: workflow, error: workflowError } = await supabase
    .from('workflows')
    .select('id, status')
    .eq('id', workflowId)
    .single()

  if (workflowError || !workflow) {
    return { error: [workflowError?.message ?? 'Workflow not found.'] }
  }

  const { data: latestVersion } = await supabase
    .from('workflow_versions')
    .select('version_number')
    .eq('workflow_id', workflowId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextVersion = (latestVersion?.version_number ?? 0) + 1
  const versionResult = await insertWorkflowVersion(
    supabase,
    workflowId,
    userId,
    document,
    changeSummary,
    workflow.status,
    nextVersion,
  )

  if ('error' in versionResult) {
    return versionResult
  }

  const workflowUpdate: Database['public']['Tables']['workflows']['Update'] = {
    key: document.settings.key,
    name: document.settings.name,
    description: document.settings.description || null,
    primary_agent_id: document.settings.primaryAgentId,
    requires_approval: document.settings.requiresApproval,
    requires_approval_reason: document.settings.requiresApproval ? document.settings.requiresApprovalReason.trim() : null,
    updated_by: userId,
  }

  if (workflow.status !== 'active') {
    workflowUpdate.active_version_id = versionResult.versionId
  }

  const { error: updateError } = await supabase.from('workflows').update(workflowUpdate).eq('id', workflowId)
  if (updateError) {
    return { error: [updateError.message] }
  }

  return versionResult
}

export async function updateWorkflowStatus(
  supabase: DbClient,
  workflowId: string,
  userId: string,
  status: 'active' | 'inactive' | 'draft',
  versionId?: string,
) {
  const update: Database['public']['Tables']['workflows']['Update'] = {
    status,
    updated_by: userId,
  }

  if (versionId) {
    update.active_version_id = versionId
  }

  const { error } = await supabase.from('workflows').update(update).eq('id', workflowId)

  if (error) {
    return { error: [error.message] }
  }

  return { status }
}

async function insertWorkflowVersion(
  supabase: DbClient,
  workflowId: string,
  userId: string,
  document: WorkflowEditorDocument,
  changeSummary: string | undefined,
  statusSnapshot: string,
  versionNumber: number,
): Promise<WorkflowSaveResult | { error: string[] }> {
  const serialized = serializeWorkflowDocument(document)

  const { data: version, error: versionError } = await supabase
    .from('workflow_versions')
    .insert({
      workflow_id: workflowId,
      version_number: versionNumber,
      status_snapshot: statusSnapshot,
      name_snapshot: document.settings.name,
      description_snapshot: document.settings.description || null,
      primary_agent_id: document.settings.primaryAgentId,
      requires_approval: document.settings.requiresApproval,
      requires_approval_reason: document.settings.requiresApproval ? document.settings.requiresApprovalReason.trim() : null,
      change_summary: changeSummary?.trim() || null,
      saved_by: userId,
    })
    .select('id')
    .single()

  if (versionError || !version) {
    return { error: [versionError?.message ?? 'Failed to save workflow version.'] }
  }

  const nodes = serialized.nodes.map((node) => ({
    workflow_version_id: version.id,
    ...node,
  }))

  const edges = serialized.edges.map((edge) => ({
    workflow_version_id: version.id,
    ...edge,
  }))

  if (nodes.length > 0) {
    const { error: nodeError } = await supabase.from('workflow_nodes').insert(nodes)
    if (nodeError) {
      return { error: [nodeError.message] }
    }
  }

  if (edges.length > 0) {
    const { error: edgeError } = await supabase.from('workflow_edges').insert(edges)
    if (edgeError) {
      return { error: [edgeError.message] }
    }
  }

  return {
    workflowId,
    versionId: version.id,
    versionNumber,
    status: document.settings.status,
  }
}

async function ensureUniqueWorkflowKey(supabase: DbClient, key: string) {
  let candidate = key
  let suffix = 2

  while (true) {
    const { data } = await supabase.from('workflows').select('id').eq('key', candidate).maybeSingle()
    if (!data) return candidate
    candidate = `${key}-${suffix}`
    suffix += 1
  }
}
