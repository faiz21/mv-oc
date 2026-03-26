import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdminModule, canAccessAdminSurface, normalizeRole } from '@/lib/roles'

export type AdminApiAuth = {
  user: { id: string; email: string }
  profile: { role: string }
  isAdmin: boolean
  departmentIds: string[]
}

type AdminApiResult =
  | { ok: true; auth: AdminApiAuth }
  | { ok: false; response: NextResponse }

/**
 * Authenticate and authorize an admin API request.
 * - `adminOnly: true` requires admin role (for mutations).
 * - `adminOnly: false` (default) allows admin + director.
 */
export async function requireAdminApi(
  options?: { adminOnly?: boolean },
): Promise<AdminApiResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  const check = options?.adminOnly ? canAccessAdminSurface : canAccessAdminModule

  if (!check(role)) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  const { data: memberships } = await supabase
    .from('department_members')
    .select('department_id')
    .eq('user_id', user.id)

  return {
    ok: true,
    auth: {
      user: { id: user.id, email: user.email ?? '' },
      profile: { role: normalizeRole(role) },
      isAdmin: canAccessAdminSurface(role),
      departmentIds: (memberships ?? []).map((m) => m.department_id),
    },
  }
}
