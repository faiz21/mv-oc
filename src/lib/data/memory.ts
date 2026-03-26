import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/types'

export async function searchMemory(
  supabase: SupabaseClient<Database>,
  queryEmbedding: number[],
  options?: { scope?: string; projectId?: string; limit?: number; threshold?: number },
): Promise<Array<{ id: string; scope: string; content: string; similarity: number }>> {
  const { data, error } = await supabase.rpc('match_memory_vectors', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    match_threshold: options?.threshold ?? 0.75,
    match_count: options?.limit ?? 5,
    filter_scope: options?.scope,
    filter_project_id: options?.projectId,
    filter_scope_ref: undefined,
  })

  if (error) return []

  return (data ?? []) as Array<{ id: string; scope: string; content: string; similarity: number }>
}

export async function getMemoryDocuments(
  supabase: SupabaseClient<Database>,
  options?: { scope?: string; limit?: number },
): Promise<Tables<'memory_documents'>[]> {
  let query = supabase
    .from('memory_documents')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(options?.limit ?? 50)

  if (options?.scope) {
    query = query.eq('scope', options.scope)
  }

  const { data } = await query
  return data ?? []
}
