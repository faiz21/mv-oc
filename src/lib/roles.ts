export type CanonicalRole = 'admin' | 'director' | 'officer' | 'member'
export type StoredRole = CanonicalRole | 'operator' | 'viewer' | string | null | undefined
export type WorkflowApproverRole = 'admin' | 'operator'

export function normalizeRole(role: StoredRole): CanonicalRole {
  if (role === 'admin') return 'admin'
  if (role === 'director') return 'director'
  if (role === 'officer' || role === 'operator') return 'officer'
  if (role === 'member' || role === 'viewer') return 'member'
  return 'member'
}

export function getRoleLabel(role: StoredRole) {
  const normalized = normalizeRole(role)

  if (normalized === 'admin') return 'Admin'
  if (normalized === 'director') return 'Director'
  if (normalized === 'officer') return 'Officer'
  return 'Member'
}

export function canAccessAdminSurface(role: StoredRole) {
  return normalizeRole(role) === 'admin'
}

export function canReviewOperations(role: StoredRole) {
  const normalized = normalizeRole(role)
  return normalized === 'admin' || normalized === 'director' || normalized === 'officer'
}

export function isAdmin(role: StoredRole) {
  return normalizeRole(role) === 'admin'
}

export function isDirector(role: StoredRole) {
  return normalizeRole(role) === 'director'
}

export function canAccessAdminModule(role: StoredRole) {
  const normalized = normalizeRole(role)
  return normalized === 'admin' || normalized === 'director'
}

export function isMemberRole(role: StoredRole) {
  return normalizeRole(role) === 'member'
}

export function toWorkflowApproverRole(role: StoredRole): WorkflowApproverRole {
  return normalizeRole(role) === 'admin' ? 'admin' : 'operator'
}
