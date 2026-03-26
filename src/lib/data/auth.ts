import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { normalizeRole, type CanonicalRole } from '@/lib/roles'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/types'

export interface AuthUser {
  id: string
  email: string
  profile: Tables<'profiles'> | null
  role: CanonicalRole
  departmentMemberships: Array<{
    department_id: string
    department_role: string
    department: { id: string; name: string; slug: string }
  }>
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: memberships } = await supabase
    .from('department_members')
    .select('department_id, department_role, departments(id, name, slug)')
    .eq('user_id', user.id)

  const departmentMemberships = (memberships ?? []).map((m) => ({
    department_id: m.department_id,
    department_role: m.department_role,
    department: (m.departments as unknown as { id: string; name: string; slug: string }) ?? {
      id: m.department_id,
      name: 'Unknown',
      slug: 'unknown',
    },
  }))

  return {
    id: user.id,
    email: user.email ?? '',
    profile: profile ?? null,
    role: normalizeRole(profile?.role),
    departmentMemberships,
  }
}

export async function requireAuthUser(): Promise<AuthUser> {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  return user
}

export async function getPendingApprovalCount(userId: string): Promise<number> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('approval_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'awaiting_review')

  return count ?? 0
}

export async function getAllProfiles(
  supabase: SupabaseClient<Database>,
): Promise<Tables<'profiles'>[]> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .is('disabled_at', null)
    .order('full_name', { ascending: true })

  return data ?? []
}
