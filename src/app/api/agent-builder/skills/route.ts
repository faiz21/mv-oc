import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canReviewOperations } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

function safeJson(value: string, fallback: Json): Json {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (!canReviewOperations(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await request.json()) as {
    name: string
    description?: string
    dispatch_mode: string
    instruction_markdown: string
    input_schema: string
    output_schema: string
    agent_definition_id: string
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  if (!body.agent_definition_id) {
    return NextResponse.json({ error: 'agent_definition_id is required' }, { status: 400 })
  }

  const nowIso = new Date().toISOString()

  // Derive a unique skill_key from the name
  const skillKey = body.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Date.now().toString(36)

  const skillPayload = {
    skill_key: skillKey,
    name: body.name.trim(),
    description: body.description?.trim() || null,
    status: 'draft',
    dispatch_mode: body.dispatch_mode ?? 'sync',
    instruction_markdown: body.instruction_markdown,
    input_schema: safeJson(body.input_schema, {}),
    output_schema: safeJson(body.output_schema, {}),
    validation_rules: [],
    human_review_required: false,
    created_by: user.id,
    updated_by: user.id,
    updated_at: nowIso,
  }

  const createdSkill = await admin
    .from('skill_definitions')
    .insert(skillPayload)
    .select('id')
    .single()

  if (createdSkill.error || !createdSkill.data?.id) {
    return NextResponse.json(
      { error: createdSkill.error?.message ?? 'Unable to create skill.' },
      { status: 500 }
    )
  }

  const skillId = createdSkill.data.id as string

  const linkedLink = await admin.from('agent_skill_links').insert({
    agent_definition_id: body.agent_definition_id,
    skill_definition_id: skillId,
    link_type: 'extended',
  })

  if (linkedLink.error) {
    return NextResponse.json(
      { error: linkedLink.error.message ?? 'Skill created but could not link to agent.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ id: skillId })
}
