import { getRoleLabel, normalizeRole, type CanonicalRole, type StoredRole } from '@/lib/roles'

export interface AssignableRoleOption {
  label: string
  value: CanonicalRole
}

export function getAssignableRoles(): AssignableRoleOption[] {
  return [
    { label: 'Admin', value: 'admin' },
    { label: 'Director', value: 'director' },
    { label: 'Officer', value: 'officer' },
    { label: 'Member', value: 'member' },
  ]
}

export function normalizePersistedRole(role: StoredRole): CanonicalRole {
  return normalizeRole(role)
}

export function shouldBlockRoleChange(input: {
  actorId: string
  targetId: string
  currentRole: StoredRole
  nextRole: CanonicalRole
}) {
  const currentRole = normalizePersistedRole(input.currentRole)

  if (input.actorId === input.targetId && currentRole === 'admin' && input.nextRole !== 'admin') {
    return 'You cannot remove your own admin access.'
  }

  if (currentRole === input.nextRole) {
    return `Role is already set to ${getRoleLabel(currentRole)}.`
  }

  return null
}
