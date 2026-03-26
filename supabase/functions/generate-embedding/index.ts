import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

interface GenerateEmbeddingPayload {
  text: string
  scope: 'step_takeaway' | 'task_item_takeaway' | 'project_takeaway'
  scope_ref: string
  project_id: string
  agent_id?: string
  workflow_id?: string
  metadata?: Record<string, unknown>
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  if (!OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'OPENAI_API_KEY is not configured' }),
      { status: 500 },
    )
  }

  let body: GenerateEmbeddingPayload
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  const { text, scope, scope_ref, project_id, agent_id, workflow_id, metadata } = body

  if (!text || !scope || !scope_ref || !project_id) {
    return new Response(
      JSON.stringify({ error: 'text, scope, scope_ref, and project_id are required' }),
      { status: 400 },
    )
  }

  const validScopes = ['step_takeaway', 'task_item_takeaway', 'project_takeaway']
  if (!validScopes.includes(scope)) {
    return new Response(
      JSON.stringify({ error: `scope must be one of: ${validScopes.join(', ')}` }),
      { status: 400 },
    )
  }

  // Call OpenAI Embeddings API
  const openaiResponse = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  })

  if (!openaiResponse.ok) {
    const errorBody = await openaiResponse.text()
    return new Response(
      JSON.stringify({ error: 'OpenAI embedding request failed', detail: errorBody }),
      { status: 502 },
    )
  }

  const openaiData = await openaiResponse.json()
  const embedding: number[] = openaiData.data?.[0]?.embedding
  const tokenCount: number = openaiData.usage?.total_tokens ?? 0

  if (!embedding || embedding.length !== 1536) {
    return new Response(
      JSON.stringify({ error: 'Invalid embedding response from OpenAI' }),
      { status: 502 },
    )
  }

  // Insert into memory_vectors
  const { data: vector, error: insertError } = await supabase
    .from('memory_vectors')
    .insert({
      scope,
      scope_ref,
      project_id,
      agent_id: agent_id ?? null,
      workflow_id: workflow_id ?? null,
      content: text,
      embedding,
      token_count: tokenCount,
      metadata: metadata ?? {},
    })
    .select('id')
    .single()

  if (insertError || !vector) {
    return new Response(
      JSON.stringify({ error: 'Failed to store embedding', detail: insertError?.message }),
      { status: 500 },
    )
  }

  return new Response(
    JSON.stringify({ memory_vector_id: vector.id, token_count: tokenCount }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})
