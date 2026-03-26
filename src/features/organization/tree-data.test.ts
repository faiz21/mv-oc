import { describe, expect, it } from 'vitest'
import { buildOrganizationTrees } from './tree-data'

describe('organization tree data', () => {
  it('builds agent and internal trees with ownership summaries', () => {
    const trees = buildOrganizationTrees({
      agents: [
        { id: 'agent-root', name: 'Operations Orchestrator', status: 'active', description: 'Root', ownerId: 'user-1' },
        { id: 'agent-child', name: 'Email Handler', status: 'active', description: 'Child', ownerId: 'user-2' },
      ],
      agentRelationships: [{ parentAgentId: 'agent-root', childAgentId: 'agent-child' }],
      profiles: [
        { id: 'user-1', fullName: 'Alex', email: 'alex@example.com', role: 'officer' },
        { id: 'user-2', fullName: 'Jamie', email: 'jamie@example.com', role: 'member' },
      ],
      departments: [{ id: 'dept-1', name: 'Operations', headUserId: 'user-1', parentDepartmentId: null }],
      reportingLines: [{ managerUserId: 'user-1', reportUserId: 'user-2' }],
      ownershipLinks: [
        { ownerUserId: 'user-1', ownedType: 'agent', ownedRef: 'agent-root' },
        { ownerUserId: 'user-2', ownedType: 'agent', ownedRef: 'agent-child' },
      ],
    })

    expect(trees.agent.nodes[0]).toMatchObject({
      id: 'agent-root',
      label: 'Operations Orchestrator',
      ownerName: 'Alex',
    })
    expect(trees.agent.edges).toEqual([{ id: 'agent-root:agent-child', source: 'agent-root', target: 'agent-child' }])
    expect(trees.internal.nodes[0]).toMatchObject({
      id: 'dept-1',
      label: 'Operations',
      type: 'department',
    })
    expect(trees.summary).toEqual({
      agents: 2,
      humans: 2,
      departments: 1,
      unassignedAgents: 0,
    })
  })
})
