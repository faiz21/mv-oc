import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/types'

export async function getTaskItems(
  supabase: SupabaseClient<Database>,
  departmentId: string,
  options?: { projectId?: string; columnId?: string; assignedTo?: string },
): Promise<Tables<'task_items'>[]> {
  let query = supabase
    .from('task_items')
    .select('*')
    .eq('department_id', departmentId)
    .order('created_at', { ascending: false })

  if (options?.projectId) {
    query = query.eq('project_id', options.projectId)
  }
  if (options?.columnId) {
    query = query.eq('board_column_id', options.columnId)
  }
  if (options?.assignedTo) {
    query = query.eq('assigned_to', options.assignedTo)
  }

  const { data } = await query
  return data ?? []
}

export async function getActionQueue(
  supabase: SupabaseClient<Database>,
  departmentId: string,
): Promise<Tables<'tasks'>[]> {
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('department_id', departmentId)
    .in('status', ['pending', 'queued', 'running', 'awaiting_approval'])
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(50)

  return data ?? []
}

export async function getApprovalQueue(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Tables<'approval_queue'>[]> {
  const { data } = await supabase
    .from('approval_queue')
    .select('*')
    .eq('status', 'awaiting_review')
    .order('created_at', { ascending: true })

  return data ?? []
}

export async function getTaskQueue(
  supabase: SupabaseClient<Database>,
  options?: {
    status?: string
    departmentIds?: string[]
    limit?: number
    offset?: number
  },
): Promise<{ tasks: Tables<'tasks'>[]; total: number }> {
  const limit = options?.limit ?? 25
  const offset = options?.offset ?? 0

  let query = supabase
    .from('tasks')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.departmentIds && options.departmentIds.length > 0) {
    query = query.in('department_id', options.departmentIds)
  }

  const { data, count } = await query

  return {
    tasks: data ?? [],
    total: count ?? 0,
  }
}

export async function getStuckTasks(
  supabase: SupabaseClient<Database>,
  departmentIds?: string[],
): Promise<Tables<'tasks'>[]> {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('status', 'running')
    .lt('updated_at', thirtyMinutesAgo)
    .order('updated_at', { ascending: true })

  if (departmentIds && departmentIds.length > 0) {
    query = query.in('department_id', departmentIds)
  }

  const { data } = await query
  return data ?? []
}

export async function updateTaskItemColumn(
  supabase: SupabaseClient<Database>,
  taskItemId: string,
  boardColumnId: string,
): Promise<void> {
  await supabase
    .from('task_items')
    .update({
      board_column_id: boardColumnId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskItemId)
}
