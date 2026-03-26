import { describe, expect, it } from 'vitest'
import { getAssignableRoles, normalizePersistedRole, shouldBlockRoleChange } from './user-role-management'

describe('user role management helpers', () => {
  it('exposes the canonical assignable roles in UI order', () => {
    expect(getAssignableRoles()).toEqual([
      { label: 'Admin', value: 'admin' },
      { label: 'Director', value: 'director' },
      { label: 'Officer', value: 'officer' },
      { label: 'Member', value: 'member' },
    ])
  })

  it('normalizes legacy stored roles to canonical values before persisting changes', () => {
    expect(normalizePersistedRole('admin')).toBe('admin')
    expect(normalizePersistedRole('director')).toBe('director')
    expect(normalizePersistedRole('officer')).toBe('officer')
    expect(normalizePersistedRole('operator')).toBe('officer')
    expect(normalizePersistedRole('viewer')).toBe('member')
    expect(normalizePersistedRole(undefined)).toBe('member')
  })

  it('blocks no-op role changes and self-demotion from admin', () => {
    expect(shouldBlockRoleChange({ actorId: 'admin-1', targetId: 'admin-1', currentRole: 'admin', nextRole: 'member' })).toBe(
      'You cannot remove your own admin access.',
    )
    expect(shouldBlockRoleChange({ actorId: 'admin-1', targetId: 'user-2', currentRole: 'officer', nextRole: 'officer' })).toBe(
      'Role is already set to Officer.',
    )
    expect(shouldBlockRoleChange({ actorId: 'admin-1', targetId: 'user-2', currentRole: 'member', nextRole: 'officer' })).toBeNull()
  })
})
