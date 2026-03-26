'use client'

import { useUser } from '@/components/providers/user-provider'
import type { CanonicalRole } from '@/lib/roles'

interface RoleGateProps {
  /** Roles that ARE allowed to see the content */
  allow: CanonicalRole[]
  /** Rendered when the user does NOT have the required role (optional) */
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Wraps content that should only be visible to specific roles.
 * viewer / director: read-only — content hidden if actions-only.
 * member: should never reach Dashboard (redirected at server level).
 */
export function RoleGate({ allow, fallback = null, children }: RoleGateProps) {
  const { role } = useUser()

  if (allow.includes(role)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
