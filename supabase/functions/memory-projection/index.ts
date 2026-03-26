import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

interface MemoryProjectionPayload {
  query_embedding: number[]
  match_threshold?: number
  match_count?: number
  filter_scope?: string
  filter_project_id?: string
  filter_scope_ref?: string
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  let body: MemoryProjectionPayload
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  const {
    query_embedding,
    match_threshold = 0.75,
    match_count = 5,
    filter_scope = null,
    filter_project_id = null,
    filter_scope_ref = null,
  } = body

  if (!query_embedding || !Array.isArray(query_embedding)) {
    return new Response(
      JSON.stringify({ error: 'query_embedding array is required' }),
      { status: 400 },
    )
  }

  if (query_embedding.length !== 1536) {
    return new Response(
      JSON.stringify({ error: `query_embedding must have 1536 dimensions, got ${query_embedding.length}` }),
      { status: 400 },
    )
  }

  const { data: results, error } = await supabase.rpc('match_memory_vectors', {
    query_embedding,
    match_threshold,
    match_count,
    filter_scope,
    filter_project_id,
    filter_scope_ref,
  })

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Memory projection query failed', detail: error.message }),
      { status: 500 },
    )
  }

  return new Response(
    JSON.stringify({ results: results ?? [] }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})
