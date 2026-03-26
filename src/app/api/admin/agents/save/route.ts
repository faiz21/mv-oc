import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canReviewOperations } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!canReviewOperations(profile?.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await request.json()) as {
    id?: string
    agentKey: string
    name: string
    description?: string
    roleSummary?: string
    capabilities: string
    allowedTools: string
    instructionMarkdown: string
    skillName?: string
    skillDescription?: string
    inputSchema: string
    outputSchema: string
  }

  const nowIso = new Date().toISOString()
  const definitionPayload = {
    agent_key: body.agentKey,
    name: body.name,
    description: body.description ?? null,
    agent_type: 'agent',
    status: 'draft',
    role_summary: body.roleSummary ?? null,
    capabilities: safeJson(body.capabilities, []),
    allowed_tools: safeJson(body.allowedTools, []),
    memory_policy: {},
    created_by: user.id,
    updated_by: user.id,
    updated_at: nowIso,
  }

  let definitionId = body.id
  if (definitionId) {
    await admin.from('agent_definitions').update(definitionPayload).eq('id', definitionId)
  } else {
    const created = await admin.from('agent_definitions').insert(definitionPayload).select('id').single()
    definitionId = created.data?.id
  }

  if (!definitionId) return NextResponse.json({ error: 'Unable to save definition.' }, { status: 400 })

  const versionResult = await admin
    .from('agent_definition_versions')
    .select('version_number')
    .eq('agent_definition_id', definitionId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()
  await admin.from('agent_definition_versions').insert({
    agent_definition_id: definitionId,
    version_number: (versionResult.data?.version_number ?? 0) + 1,
    snapshot: definitionPayload,
    change_summary: 'Saved from builder',
    saved_by: user.id,
  })

  if (body.skillName?.trim()) {
    const skillPayload = {
      skill_key: `${body.agentKey}-skill`,
      name: body.skillName.trim(),
      description: body.skillDescription?.trim() || null,
      status: 'draft',
      dispatch_mode: 'model_invocation',
      instruction_markdown: body.instructionMarkdown,
      input_schema: safeJson(body.inputSchema, {}),
      output_schema: safeJson(body.outputSchema, {}),
      validation_rules: ['requires_human_review'],
      human_review_required: true,
      created_by: user.id,
      updated_by: user.id,
      updated_at: nowIso,
    }

    const existingSkill = await admin.from('skill_definitions').select('id').eq('skill_key', `${body.agentKey}-skill`).maybeSingle()
    let skillId = existingSkill.data?.id
    if (skillId) {
      await admin.from('skill_definitions').update(skillPayload).eq('id', skillId)
    } else {
      const createdSkill = await admin.from('skill_definitions').insert(skillPayload).select('id').single()
      skillId = createdSkill.data?.id
    }

    if (skillId) {
      await admin.from('agent_skill_links').delete().eq('agent_definition_id', definitionId)
      await admin.from('agent_skill_links').insert({
        agent_definition_id: definitionId,
        skill_definition_id: skillId,
        link_type: 'core',
      })
    }
  }

  await admin.from('audit_log').insert({
    actor_type: 'human',
    actor_ref: user.id,
    entity_type: 'agent_definition',
    entity_id: definitionId,
    event: body.id ? 'agent:definition_updated' : 'agent:definition_created',
    data: { agent_key: body.agentKey, name: body.name },
  })

  return NextResponse.json({ id: definitionId })
}

function safeJson(value: string, fallback: unknown) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}
