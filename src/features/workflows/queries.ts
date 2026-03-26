import type { Database } from '@/types/database'
import { createDefaultWorkflowDocument, hydrateWorkflowDocument, type WorkflowSettings, type WorkflowVersionSummary } from '@/features/workflows/editor-model'

type DbClient = any

export interface WorkflowListItem {
  id: string
  key: string
  name: string
  description: string | null
  status: 'draft' | 'active' | 'inactive'
  requires_approval: boolean
  updated_at: string
  active_version_id: string | null
  versionCount: number
}

export async function getWorkflowList(supabase: DbClient): Promise<WorkflowListItem[]> {
  const { data } = await supabase
    .from('workflows')
    .select('id, key, name, description, status, requires_approval, updated_at, active_version_id')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  const workflows = (data ?? []) as Array<Omit<WorkflowListItem, 'versionCount'>>
  const workflowIds = workflows.map((workflow) => workflow.id)
  const versionCounts = workflowIds.length
    ? await supabase
        .from('workflow_versions')
        .select('workflow_id')
        .in('workflow_id', workflowIds)
    : { data: [] as Array<{ workflow_id: string }> }

  const counts = new Map<string, number>()
  for (const item of versionCounts.data ?? []) {
    counts.set(item.workflow_id, (counts.get(item.workflow_id) ?? 0) + 1)
  }

  return workflows.map((workflow): WorkflowListItem => ({
    ...workflow,
    versionCount: counts.get(workflow.id) ?? 0,
  }))
}

export async function getWorkflowEditorData(supabase: DbClient, workflowId: string) {
  const { data: workflow, error } = await supabase
    .from('workflows')
    .select('id, key, name, description, status, primary_agent_id, requires_approval, requires_approval_reason, active_version_id')
    .eq('id', workflowId)
    .single()

  if (error || !workflow) {
    return null
  }

  const [latestVersionResult, versionsResult, agentsResult] = await Promise.all([
    supabase
      .from('workflow_versions')
      .select('id, version_number, created_at, change_summary')
      .eq('workflow_id', workflowId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('workflow_versions')
      .select('id, version_number, created_at, change_summary')
      .eq('workflow_id', workflowId)
      .order('version_number', { ascending: false })
      .limit(8),
    supabase
      .from('agents')
      .select('id, name, status')
      .is('deleted_at', null)
      .order('name', { ascending: true }),
  ])

  const latestVersion = latestVersionResult.data
  const versions = ((versionsResult.data ?? []) as Array<{
    id: string
    version_number: number
    created_at: string
    change_summary: string | null
  }>).map((version): WorkflowVersionSummary => ({
    id: version.id,
    versionNumber: version.version_number,
    createdAt: version.created_at,
    changeSummary: version.change_summary,
  }))

  const settings: WorkflowSettings = {
    workflowId: workflow.id,
    activeVersionId: workflow.active_version_id,
    name: workflow.name,
    key: workflow.key,
    description: workflow.description ?? '',
    primaryAgentId: workflow.primary_agent_id,
    requiresApproval: workflow.requires_approval,
    requiresApprovalReason: workflow.requires_approval_reason ?? '',
    status: workflow.status,
  }

  if (!latestVersion) {
    return {
      document: createDefaultWorkflowDocument(settings),
      versions,
      agents: agentsResult.data ?? [],
      workflow,
    }
  }

  const [nodesResult, edgesResult] = await Promise.all([
    supabase
      .from('workflow_nodes')
      .select('node_key, node_type, label, position_x, position_y, config')
      .eq('workflow_version_id', latestVersion.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('workflow_edges')
      .select('edge_key, source_node_key, target_node_key, condition_type, config')
      .eq('workflow_version_id', latestVersion.id)
      .order('created_at', { ascending: true }),
  ])

  return {
    document: hydrateWorkflowDocument({
      settings,
      nodes: nodesResult.data ?? [],
      edges: edgesResult.data ?? [],
    }),
    versions,
    agents: agentsResult.data ?? [],
    workflow,
  }
}
