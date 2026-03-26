import { describe, expect, it } from 'vitest'
import { moduleMeta } from './module-meta'

describe('module metadata', () => {
  it('exposes the phase 2 modules in navigation order', () => {
    expect(moduleMeta.map((item) => item.href)).toEqual([
      '/hub',
      '/workflows',
      '/mission-control',
      '/dashboard',
      '/wiki',
      '/automation/monitor',
      '/organization-tree',
      '/admin',
    ])
  })

  it('exposes dedicated admin routes in sidebar sections', () => {
    const admin = moduleMeta.find((item) => item.href === '/admin')

    expect(admin?.sections).toEqual([
      { label: 'Users', href: '/admin/users' },
      { label: 'Agents', href: '/admin/agents' },
      { label: 'Environment', href: '/admin/environment' },
      { label: 'Diagnostics', href: '/admin/diagnostics' },
      { label: 'Queue', href: '/admin/queue' },
      { label: 'Audit Log', href: '/admin/audit-log' },
    ])
  })

  it('keeps phase 2 shortcuts consistent with their documented entrypoints', () => {
    expect(moduleMeta.find((item) => item.href === '/wiki')?.sections?.[0]).toEqual({
      label: 'Knowledge Base',
      href: '/wiki',
    })
    expect(moduleMeta.find((item) => item.href === '/automation/monitor')?.quickActions).toEqual([
      { label: 'Open Mission Control', href: '/mission-control' },
      { label: 'Open Dashboard', href: '/dashboard' },
    ])
    expect(moduleMeta.find((item) => item.href === '/organization-tree')?.quickActions).toEqual([
      { label: 'Open Agent Builder', href: '/admin/agents' },
    ])
  })
})
