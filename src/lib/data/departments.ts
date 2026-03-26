import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/types'

export async function getDepartments(
  supabase: SupabaseClient<Database>,
): Promise<Tables<'departments'>[]> {
  const { data } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true })

  return data ?? []
}

export async function getDepartmentMembers(
  supabase: SupabaseClient<Database>,
  departmentId: string,
): Promise<Array<Tables<'department_members'> & { profiles: Tables<'profiles'> | null }>> {
  const { data } = await supabase
    .from('department_members')
    .select('*, profiles(*)')
    .eq('department_id', departmentId)
    .order('department_role', { ascending: true })

  return (data ?? []) as Array<Tables<'department_members'> & { profiles: Tables<'profiles'> | null }>
}

export async function getDepartmentProjects(
  supabase: SupabaseClient<Database>,
  departmentId: string,
): Promise<Tables<'projects'>[]> {
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('department_id', departmentId)
    .order('updated_at', { ascending: false })

  return data ?? []
}

export async function getBoardColumns(
  supabase: SupabaseClient<Database>,
  departmentId: string,
): Promise<Tables<'board_columns'>[]> {
  const { data } = await supabase
    .from('board_columns')
    .select('*')
    .eq('department_id', departmentId)
    .order('sort_order', { ascending: true })

  return data ?? []
}
