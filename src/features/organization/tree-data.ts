export interface AgentTreeRecord {
  id: string
  name: string
  status: string
  description: string | null
  ownerId: string | null
  endpoint?: string | null
  capabilities?: string[]
}

export interface AgentRelationshipRecord {
  parentAgentId: string
  childAgentId: string
}

export interface ProfileTreeRecord {
  id: string
  fullName: string | null
  email: string
  role: string
  departmentId?: string | null
}

export interface DepartmentTreeRecord {
  id: string
  name: string
  headUserId: string | null
  parentDepartmentId: string | null
}

export interface ReportingLineRecord {
  managerUserId: string
  reportUserId: string
}

export interface OwnershipLinkRecord {
  ownerUserId: string
  ownedType: string
  ownedRef: string
}

// ---- Node types used by the canvas ----

export interface AgentNode {
  kind: 'agent'
  id: string
  label: string
  status: string
  description?: string | null
  endpoint?: string | null
  capabilities: string[]
  ownerName?: string | null
  parentId?: string
}

export interface HumanNode {
  kind: 'human'
  id: string
  label: string
  role: string
  email: string
  departmentName?: string | null
  managerId?: string | null
  managerName?: string | null
}

export interface TreeEdge {
  id: string
  source: string
  target: string
}

export interface OrganizationTreeData {
  agentTree: {
    nodes: AgentNode[]
    edges: TreeEdge[]
  }
  internalTree: {
    nodes: HumanNode[]
    edges: TreeEdge[]
  }
  stats: {
    totalAgents: number
    totalHumans: number
    totalDepartments: number
    unassignedAgents: number
  }
  // Legacy fields kept for page.tsx compatibility
  agent: {
    nodes: Array<{ id: string; label: string; type: string; status?: string; description?: string | null; ownerName?: string | null; role?: string; headUserName?: string | null }>
    edges: Array<{ id: string; source: string; target: string }>
  }
  internal: {
    nodes: Array<{ id: string; label: string; type: string; status?: string; description?: string | null; ownerName?: string | null; role?: string; headUserName?: string | null }>
    edges: Array<{ id: string; source: string; target: string }>
  }
  summary: {
    agents: number
    humans: number
    departments: number
    unassignedAgents: number
  }
}

export function buildOrganizationTrees(input: {
  agents: AgentTreeRecord[]
  agentRelationships: AgentRelationshipRecord[]
  profiles: ProfileTreeRecord[]
  departments: DepartmentTreeRecord[]
  reportingLines: ReportingLineRecord[]
  ownershipLinks: OwnershipLinkRecord[]
}): OrganizationTreeData {
  const profileLabels = new Map(input.profiles.map((p) => [p.id, p.fullName ?? p.email]))
  const departmentNames = new Map(input.departments.map((d) => [d.id, d.name]))

  // Build manager lookup: reportUserId -> managerUserId
  const managerOf = new Map(input.reportingLines.map((l) => [l.reportUserId, l.managerUserId]))

  // Build agent parent lookup: childAgentId -> parentAgentId
  const agentParentOf = new Map(input.agentRelationships.map((r) => [r.childAgentId, r.parentAgentId]))

  // Build ownership lookup: agentId -> ownerUserId
  const ownerByAgent = new Map(
    input.ownershipLinks
      .filter((l) => l.ownedType === 'agent')
      .map((l) => [l.ownedRef, l.ownerUserId])
  )

  // ---- Agent tree nodes ----
  const agentNodes: AgentNode[] = input.agents.map((agent) => ({
    kind: 'agent',
    id: agent.id,
    label: agent.name,
    status: agent.status,
    description: agent.description,
    endpoint: agent.endpoint ?? null,
    capabilities: agent.capabilities ?? [],
    ownerName: agent.ownerId ? (profileLabels.get(agent.ownerId) ?? null) : (ownerByAgent.get(agent.id) ? profileLabels.get(ownerByAgent.get(agent.id)!) ?? null : null),
    parentId: agentParentOf.get(agent.id),
  }))

  const agentEdges: TreeEdge[] = input.agentRelationships.map((r) => ({
    id: `${r.parentAgentId}:${r.childAgentId}`,
    source: r.parentAgentId,
    target: r.childAgentId,
  }))

  // ---- Internal tree nodes (humans only; departments shown as labels) ----
  const humanNodes: HumanNode[] = input.profiles.map((profile) => {
    const managerId = managerOf.get(profile.id) ?? null
    return {
      kind: 'human',
      id: profile.id,
      label: profile.fullName ?? profile.email,
      role: profile.role,
      email: profile.email,
      departmentName: profile.departmentId ? (departmentNames.get(profile.departmentId) ?? null) : null,
      managerId,
      managerName: managerId ? (profileLabels.get(managerId) ?? null) : null,
    }
  })

  const internalEdges: TreeEdge[] = input.reportingLines.map((l) => ({
    id: `${l.managerUserId}:${l.reportUserId}`,
    source: l.managerUserId,
    target: l.reportUserId,
  }))

  const unassignedCount = input.agents.filter(
    (a) => !input.ownershipLinks.some((l) => l.ownedType === 'agent' && l.ownedRef === a.id) && !a.ownerId
  ).length

  // Legacy-compatible node shape for existing page.tsx
  const legacyAgentNodes = input.agents.map((agent) => ({
    id: agent.id,
    label: agent.name,
    type: 'agent' as const,
    status: agent.status,
    description: agent.description,
    ownerName: ownerByAgent.get(agent.id) ? profileLabels.get(ownerByAgent.get(agent.id)!) ?? null : null,
  }))

  const legacyAgentEdges = input.agentRelationships.map((r) => ({
    id: `${r.parentAgentId}:${r.childAgentId}`,
    source: r.parentAgentId,
    target: r.childAgentId,
  }))

  const legacyInternalNodes = [
    ...input.departments.map((d) => ({
      id: d.id,
      label: d.name,
      type: 'department' as const,
      headUserName: d.headUserId ? (profileLabels.get(d.headUserId) ?? null) : null,
    })),
    ...input.profiles.map((p) => ({
      id: p.id,
      label: p.fullName ?? p.email,
      type: 'person' as const,
      role: p.role,
    })),
  ]

  const legacyInternalEdges = [
    ...input.departments
      .filter((d) => d.parentDepartmentId)
      .map((d) => ({
        id: `${d.parentDepartmentId}:${d.id}`,
        source: d.parentDepartmentId!,
        target: d.id,
      })),
    ...input.reportingLines.map((l) => ({
      id: `${l.managerUserId}:${l.reportUserId}`,
      source: l.managerUserId,
      target: l.reportUserId,
    })),
  ]

  return {
    agentTree: { nodes: agentNodes, edges: agentEdges },
    internalTree: { nodes: humanNodes, edges: internalEdges },
    stats: {
      totalAgents: input.agents.length,
      totalHumans: input.profiles.length,
      totalDepartments: input.departments.length,
      unassignedAgents: unassignedCount,
    },
    // Legacy
    agent: { nodes: legacyAgentNodes, edges: legacyAgentEdges },
    internal: { nodes: legacyInternalNodes, edges: legacyInternalEdges },
    summary: {
      agents: input.agents.length,
      humans: input.profiles.length,
      departments: input.departments.length,
      unassignedAgents: unassignedCount,
    },
  }
}
