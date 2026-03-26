export const ROLES = {
  director: 'director',
  officer: 'officer',
  member: 'member',
  admin: 'admin',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<Role, string> = {
  director: 'Director',
  officer: 'Officer',
  member: 'Member',
  admin: 'Admin',
}
