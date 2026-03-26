import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createWorkflowRecord } from '@/features/workflows/persistence'
import type { WorkflowEditorDocument } from '@/features/workflows/editor-model'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as {
    document: WorkflowEditorDocument
    changeSummary?: string
  }

  const result = await createWorkflowRecord(supabase, user.id, body.document, body.changeSummary)

  if ('error' in result) {
    return NextResponse.json({ errors: result.error }, { status: 400 })
  }

  return NextResponse.json(result)
}
