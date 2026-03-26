import { describe, expect, it } from 'vitest'
import { getAdminHighlights, getAdminSections } from './admin-overview'

describe('admin overview helpers', () => {
  it('builds the expected admin sections from a snapshot', () => {
    const sections = getAdminSections({
      activeUsers: 12,
      registeredAgents: 4,
      unreachableAgents: 1,
      verifiedEnvChecks: 8,
      stuckTasks: 2,
      auditEvents24h: 17,
    })

    expect(sections).toHaveLength(6)
    expect(sections[0]).toMatchObject({ label: 'Users', stat: '12 active', href: '/admin/users' })
    expect(sections[1]).toMatchObject({ label: 'Agents', stat: '4 registered · 1 unreachable' })
    expect(sections[2]).toMatchObject({ label: 'Environment', stat: '8 checks' })
  })

  it('summarizes the governance highlights', () => {
    const highlights = getAdminHighlights({
      activeUsers: 12,
      registeredAgents: 4,
      unreachableAgents: 1,
      verifiedEnvChecks: 8,
      stuckTasks: 2,
      auditEvents24h: 17,
    })

    expect(highlights).toEqual([
      expect.objectContaining({ label: 'Access control', value: 'Admin only' }),
      expect.objectContaining({ label: 'Env verification', value: '8 checks' }),
      expect.objectContaining({ label: 'Runtime posture', value: '1 unreachable' }),
      expect.objectContaining({ label: 'Audit coverage', value: '17 events' }),
    ])
  })
})
