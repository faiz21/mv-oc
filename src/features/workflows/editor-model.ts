import type { Edge, Node } from '@xyflow/react'
import type { Json } from '@/types/database'

// ---------------------------------------------------------------------------
// Node, output, and gate type unions
// ---------------------------------------------------------------------------

export type WorkflowNodeType =
  | 'start'
  | 'agent_task'
  | 'approval_gate'
  | 'end'
  | 'parallel_branch'
  | 'wait_join'
  | 'webhook_trigger'

export type WorkflowOutputType = 'internal' | 'document' | 'outbound-message'
export type WorkflowGateType = 'general' | 'document' | 'outbound-message' | 'publish'
export type WorkflowStatus = 'draft' | 'active' | 'inactive'

export type ModelTier = 'top' | 'regular' | 'small'
export type ModelProvider = 'anthropic' | 'openai'

export type TriggerType = 'manual' | 'webhook' | 'cron' | 'channel-message'

export type ParallelCompletionStrategy = 'all' | 'any' | 'threshold'
export type WebhookAuthMethod = 'none' | 'api_key' | 'hmac'
export type ErrorStrategy = 'retry' | 'skip' | 'fail'

// ---------------------------------------------------------------------------
// Per-node-type config interfaces
// ---------------------------------------------------------------------------

export interface AgentTaskConfig {
  agentId?: string | null
  promptTemplate?: string
  modelProvider?: ModelProvider
  modelTier?: ModelTier
  timeoutSeconds?: number
  retryCount?: number
  errorStrategy?: ErrorStrategy
  inputSchema?: string
  outputSchema?: string
}

export interface ApprovalGateConfig {
  gateType?: WorkflowGateType
  approverRole?: 'operator' | 'admin'
  slaHours?: number
  escalationTarget?: string
}

export interface ParallelBranchConfig {
  branchCount?: number
  branchLabels?: string[]
  completionStrategy?: ParallelCompletionStrategy
  completionThreshold?: number
}

export interface WaitJoinConfig {
  timeoutSeconds?: number
  errorStrategy?: ErrorStrategy
  incomingBranchIds?: string[]
}

export interface WebhookTriggerConfig {
  webhookUrl?: string
  payloadSchema?: string
  authMethod?: WebhookAuthMethod
  authSecret?: string
}

// ---------------------------------------------------------------------------
// Node data
// ---------------------------------------------------------------------------

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string
  // Start node
  triggerType?: TriggerType
  // End node
  outputType?: WorkflowOutputType
  // Agent task
  agentId?: string | null
  promptTemplate?: string
  modelProvider?: ModelProvider
  modelTier?: ModelTier
  timeoutSeconds?: number
  retryCount?: number
  errorStrategy?: ErrorStrategy
  inputSchema?: string
  outputSchema?: string
  // Approval gate
  gateType?: WorkflowGateType
  approverRole?: 'operator' | 'admin'
  slaHours?: number
  escalationTarget?: string
  // Parallel branch
  branchCount?: number
  branchLabels?: string[]
  completionStrategy?: ParallelCompletionStrategy
  completionThreshold?: number
  // Wait/join
  incomingBranchIds?: string[]
  // Webhook trigger
  webhookUrl?: string
  payloadSchema?: string
  authMethod?: WebhookAuthMethod
  authSecret?: string
}

// ---------------------------------------------------------------------------
// Editor graph types
// ---------------------------------------------------------------------------

export type WorkflowEditorNode = Node<WorkflowNodeData, WorkflowNodeType>

export interface WorkflowEdgeData extends Record<string, unknown> {
  conditionType: 'always' | 'success' | 'failure' | 'approval'
}

export type WorkflowEditorEdge = Edge<WorkflowEdgeData>

export interface WorkflowVersionSummary {
  id: string
  versionNumber: number
  createdAt: string
  changeSummary: string | null
}

export interface WorkflowEditorDocument {
  settings: WorkflowSettings
  nodes: WorkflowEditorNode[]
  edges: WorkflowEditorEdge[]
}

export interface WorkflowSettings {
  workflowId?: string
  activeVersionId?: string | null
  name: string
  key: string
  description: string
  departmentId?: string | null
  primaryAgentId: string | null
  requiresApproval: boolean
  requiresApprovalReason: string
  status: WorkflowStatus
  triggerType?: TriggerType
  workflowSlaMinutes?: number
}

export interface WorkflowValidationResult {
  isValid: boolean
  errors: string[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const APPROVAL_REQUIRED_OUTPUTS: WorkflowOutputType[] = ['document', 'outbound-message']
export const APPROVAL_REQUIRED_GATES: WorkflowGateType[] = ['document', 'outbound-message', 'publish']

export const MODEL_TIER_LABELS: Record<ModelTier, string> = {
  top: 'Top (Claude Opus / GPT-5.x)',
  regular: 'Regular (Claude Sonnet / GPT-5-mini)',
  small: 'Small (Claude Haiku / GPT-5-nano)',
}

export const NODE_TYPE_LABELS: Record<WorkflowNodeType, string> = {
  start: 'Start',
  agent_task: 'Agent Task',
  approval_gate: 'Approval Gate',
  end: 'End',
  parallel_branch: 'Parallel Branch',
  wait_join: 'Wait / Join',
  webhook_trigger: 'Webhook Trigger',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function slugifyWorkflowKey(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return base || 'workflow-draft'
}

export function createDefaultWorkflowDocument(partial?: Partial<WorkflowSettings>): WorkflowEditorDocument {
  const name = partial?.name ?? 'New Workflow'
  const key = partial?.key ?? slugifyWorkflowKey(name)

  return {
    settings: {
      workflowId: partial?.workflowId,
      activeVersionId: partial?.activeVersionId ?? null,
      name,
      key,
      description: partial?.description ?? '',
      departmentId: partial?.departmentId ?? null,
      primaryAgentId: partial?.primaryAgentId ?? null,
      requiresApproval: partial?.requiresApproval ?? false,
      requiresApprovalReason: partial?.requiresApprovalReason ?? '',
      status: partial?.status ?? 'draft',
      triggerType: partial?.triggerType ?? 'manual',
      workflowSlaMinutes: partial?.workflowSlaMinutes,
    },
    nodes: [
      createEditorNode('start-node', 'start', { x: 48, y: 120 }, { label: 'Start', triggerType: 'manual' }),
      createEditorNode('agent-node', 'agent_task', { x: 312, y: 120 }, { label: 'Agent Task', promptTemplate: '', agentId: partial?.primaryAgentId ?? null }),
      createEditorNode('end-node', 'end', { x: 576, y: 120 }, { label: 'End', outputType: 'internal' }),
    ],
    edges: [
      createEditorEdge('edge-start-agent', 'start-node', 'agent-node'),
      createEditorEdge('edge-agent-end', 'agent-node', 'end-node'),
    ],
  }
}

export function createEditorNode(
  id: string,
  type: WorkflowNodeType,
  position: { x: number; y: number },
  data: WorkflowNodeData,
): WorkflowEditorNode {
  return { id, type, position, data }
}

export function createEditorEdge(id: string, source: string, target: string): WorkflowEditorEdge {
  return {
    id,
    source,
    target,
    data: { conditionType: 'always' },
    animated: false,
  }
}

// ---------------------------------------------------------------------------
// Default data per node type
// ---------------------------------------------------------------------------

export function defaultNodeData(type: WorkflowNodeType): WorkflowNodeData {
  switch (type) {
    case 'start':
      return { label: 'Start', triggerType: 'manual' }
    case 'agent_task':
      return { label: 'Agent Task', promptTemplate: '', agentId: null, modelTier: 'regular', modelProvider: 'anthropic' }
    case 'approval_gate':
      return { label: 'Approval Gate', gateType: 'general', approverRole: 'operator' }
    case 'end':
      return { label: 'End', outputType: 'internal' }
    case 'parallel_branch':
      return { label: 'Parallel Branch', branchCount: 2, branchLabels: ['Branch A', 'Branch B'], completionStrategy: 'all' }
    case 'wait_join':
      return { label: 'Wait / Join', timeoutSeconds: 3600, errorStrategy: 'fail', incomingBranchIds: [] }
    case 'webhook_trigger':
      return { label: 'Webhook Trigger', webhookUrl: '', payloadSchema: '{}', authMethod: 'none' }
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateWorkflowDocument(document: WorkflowEditorDocument): WorkflowValidationResult {
  const errors: string[] = []
  const { settings, nodes, edges } = document

  if (!settings.name.trim()) errors.push('Workflow name is required.')
  if (!settings.key.trim()) errors.push('Workflow key is required.')

  const startNodes = nodes.filter((node) => node.type === 'start')
  const endNodes = nodes.filter((node) => node.type === 'end')

  if (startNodes.length === 0) errors.push('Add at least one start node.')
  if (endNodes.length === 0) errors.push('Add at least one end node.')

  const nodeIds = new Set(nodes.map((node) => node.id))
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push('Every edge must connect valid nodes.')
      break
    }
  }

  // DAG validation — cycle detection via topological sort (Kahn's algorithm)
  const cycleError = detectCycles(nodes, edges)
  if (cycleError) errors.push(cycleError)

  // Parallel branch / wait-join pairing
  const parallelNodes = nodes.filter((n) => n.type === 'parallel_branch')
  const waitJoinNodes = nodes.filter((n) => n.type === 'wait_join')
  if (parallelNodes.length !== waitJoinNodes.length) {
    errors.push('Every parallel branch must have a matching wait/join node.')
  }

  // Webhook trigger can only appear right after start
  const webhookTriggers = nodes.filter((n) => n.type === 'webhook_trigger')
  for (const wt of webhookTriggers) {
    const incomingEdges = edges.filter((e) => e.target === wt.id)
    const allFromStart = incomingEdges.every((e) => {
      const sourceNode = nodes.find((n) => n.id === e.source)
      return sourceNode?.type === 'start'
    })
    if (incomingEdges.length === 0 || !allFromStart) {
      errors.push('Webhook trigger must be the first node after start.')
    }
  }

  // Approval gate enforcement
  const hasApprovalRequiredOutput = requiresWorkflowApproval(nodes)
  if (hasApprovalRequiredOutput && !settings.requiresApproval) {
    errors.push('Approval-required outputs must enable requires approval.')
  }

  if (settings.requiresApproval && !settings.requiresApprovalReason.trim()) {
    errors.push('Approval reason is required when requires approval is enabled.')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Detect cycles in the directed graph using Kahn's algorithm.
 * Returns an error string if a cycle is detected, or null otherwise.
 */
function detectCycles(nodes: WorkflowEditorNode[], edges: WorkflowEditorEdge[]): string | null {
  if (nodes.length === 0) return null

  const nodeIds = new Set(nodes.map((n) => n.id))
  const inDegree = new Map<string, number>()
  const adjacency = new Map<string, string[]>()

  for (const id of nodeIds) {
    inDegree.set(id, 0)
    adjacency.set(id, [])
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue
    adjacency.get(edge.source)!.push(edge.target)
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
  }

  const queue: string[] = []
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id)
  }

  let visited = 0
  while (queue.length > 0) {
    const current = queue.shift()!
    visited++
    for (const neighbor of adjacency.get(current) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1
      inDegree.set(neighbor, newDeg)
      if (newDeg === 0) queue.push(neighbor)
    }
  }

  if (visited < nodeIds.size) {
    return 'Workflow graph contains a cycle. Remove circular connections.'
  }
  return null
}

export function requiresWorkflowApproval(nodes: WorkflowEditorNode[]) {
  return nodes.some((node) => {
    if (node.type === 'end') {
      return APPROVAL_REQUIRED_OUTPUTS.includes(node.data.outputType ?? 'internal')
    }

    if (node.type === 'approval_gate') {
      return APPROVAL_REQUIRED_GATES.includes(node.data.gateType ?? 'general')
    }

    return false
  })
}

// ---------------------------------------------------------------------------
// Serialization / hydration
// ---------------------------------------------------------------------------

export interface SerializedWorkflowNode {
  node_key: string
  node_type: WorkflowNodeType
  label: string
  position_x: number
  position_y: number
  config: Json
}

export interface SerializedWorkflowEdge {
  edge_key: string
  source_node_key: string
  target_node_key: string
  condition_type: 'always' | 'success' | 'failure' | 'approval'
  config: Json
}

export function serializeWorkflowDocument(document: WorkflowEditorDocument) {
  return {
    workflow: {
      key: document.settings.key,
      name: document.settings.name,
      description: document.settings.description || null,
      primary_agent_id: document.settings.primaryAgentId,
      requires_approval: document.settings.requiresApproval,
      requires_approval_reason: document.settings.requiresApproval ? document.settings.requiresApprovalReason.trim() : null,
      status: document.settings.status,
      trigger_type: document.settings.triggerType ?? 'manual',
      workflow_sla_minutes: document.settings.workflowSlaMinutes ?? null,
    },
    nodes: document.nodes.map<SerializedWorkflowNode>((node) => ({
      node_key: node.id,
      node_type: node.type,
      label: node.data.label,
      position_x: node.position.x,
      position_y: node.position.y,
      config: sanitizeNodeConfig(node),
    })),
    edges: document.edges.map<SerializedWorkflowEdge>((edge) => ({
      edge_key: edge.id,
      source_node_key: edge.source,
      target_node_key: edge.target,
      condition_type: edge.data?.conditionType ?? 'always',
      config: {},
    })),
  }
}

export function hydrateWorkflowDocument(input: {
  settings: WorkflowSettings
  nodes: Array<{
    node_key: string
    node_type: WorkflowNodeType
    label: string
    position_x: number | null
    position_y: number | null
    config: Json
  }>
  edges: Array<{
    edge_key: string
    source_node_key: string
    target_node_key: string
    condition_type: 'always' | 'success' | 'failure' | 'approval'
    config: Json
  }>
}): WorkflowEditorDocument {
  return {
    settings: input.settings,
    nodes: input.nodes.map((node) => ({
      id: node.node_key,
      type: node.node_type,
      position: {
        x: Number(node.position_x ?? 0),
        y: Number(node.position_y ?? 0),
      },
      data: {
        label: node.label,
        ...(typeof node.config === 'object' && node.config && !Array.isArray(node.config) ? node.config : {}),
      } as WorkflowNodeData,
    })),
    edges: input.edges.map((edge) => ({
      id: edge.edge_key,
      source: edge.source_node_key,
      target: edge.target_node_key,
      data: { conditionType: edge.condition_type },
    })),
  }
}

function sanitizeNodeConfig(node: WorkflowEditorNode): Json {
  const { label: _label, ...rest } = node.data
  return rest as Json
}
