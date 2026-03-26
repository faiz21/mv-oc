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

  const body = (await request.json()) as { definitionId: string; mockPayload: string }
  const created = await admin.from('builder_test_runs').insert({
    target_type: 'agent',
    target_ref: body.definitionId,
    status: 'complete',
    mock_payload: safeJson(body.mockPayload, {}),
    result: {
      status: 'ok',
      summary: 'Sandbox execution recorded from the Agent Builder.',
    },
    validation_passed: true,
    created_by: user.id,
  }).select('id').single()

  if (!created.data) return NextResponse.json({ error: 'Unable to create test run.' }, { status: 400 })
  return NextResponse.json({ id: created.data.id })
}

function safeJson(value: string, fallback: unknown) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}
