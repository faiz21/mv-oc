export interface HubTask {
  id: string
  title: string
  type: string
  status: string
  priority: number
  dueAt: string | null
  createdAt: string
  updatedAt: string
  error: string | null
  sourceRef: string | null
  workflowId: string | null
  agentId: string | null
}

export interface HubApprovalItem {
  id: string
  gateType: string
  title: string
  summary: string
  entityLabel: string
  stepLabel: string
  requesterLabel: string
  createdAt: string
  expiresAt: string | null
  sourceRef: string
}

export interface HubActivityItem {
  id: string
  entityType: string
  event: string
  actorType: string
  actorRef: string | null
  summary: string
  createdAt: string
  tone: 'info' | 'warn' | 'error' | 'success'
}

export interface HubAgentItem {
  id: string
  name: string
  status: string
  lastSeen: string | null
  errorRate24h: number | null
}

export interface HubQuote {
  quote: string
  author: string
  date: string
}

