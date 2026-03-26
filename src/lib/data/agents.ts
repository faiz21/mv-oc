import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/types'

export async function getAgents(
  supabase: SupabaseClient<Database>,
): Promise<Tables<'agents'>[]> {
  const { data } = await supabase
    .from('agents')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  return data ?? []
}

export async function getAgentDetail(
  supabase: SupabaseClient<Database>,
  agentId: string,
): Promise<Tables<'agents'> | null> {
  const { data } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single()

  return data ?? null
}

export async function getRuntimeAgents(
  supabase: SupabaseClient<Database>,
  departmentIds?: string[],
): Promise<Tables<'agents'>[]> {
  let query = supabase
    .from('agents')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (departmentIds && departmentIds.length > 0) {
    query = query.in('department_id', departmentIds)
  }

  const { data } = await query
  return data ?? []
}

export async function getAgentDefinitions(
  supabase: SupabaseClient<Database>,
): Promise<Tables<'agent_definitions'>[]> {
  const { data } = await supabase
    .from('agent_definitions')
    .select('*')
    .order('name', { ascending: true })

  return data ?? []
}

export async function getAgentRuntimeStats(
  supabase: SupabaseClient<Database>,
  departmentIds?: string[],
): Promise<{ total: number; unreachable: number }> {
  let query = supabase
    .from('agents')
    .select('status', { count: 'exact' })
    .is('deleted_at', null)

  if (departmentIds && departmentIds.length > 0) {
    query = query.in('department_id', departmentIds)
  }

  const { data, count } = await query

  const unreachable = (data ?? []).filter(
    (a) => a.status === 'unreachable' || a.status === 'error',
  ).length

  return { total: count ?? 0, unreachable }
}
