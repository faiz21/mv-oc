import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables, Insertable } from '@/types'

export async function getProject(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<Tables<'projects'> | null> {
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  return data ?? null
}

export async function getProjectTaskItems(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<Tables<'task_items'>[]> {
  const { data } = await supabase
    .from('task_items')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function createProject(
  supabase: SupabaseClient<Database>,
  input: Insertable<'projects'>,
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabase
    .from('projects')
    .insert(input)
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: data.id }
}

export async function updateProjectStatus(
  supabase: SupabaseClient<Database>,
  projectId: string,
  status: string,
): Promise<void> {
  await supabase
    .from('projects')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', projectId)
}
