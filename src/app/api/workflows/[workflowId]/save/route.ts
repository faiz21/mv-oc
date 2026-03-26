import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { saveWorkflowVersion } from '@/features/workflows/persistence'
import type { WorkflowEditorDocument } from '@/features/workflows/editor-model'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workflowId: string }> },
) {
  const { workflowId } = await params
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

  const result = await saveWorkflowVersion(supabase, user.id, workflowId, body.document, body.changeSummary)

  if ('error' in result) {
    return NextResponse.json({ errors: result.error }, { status: 400 })
  }

  return NextResponse.json(result)
}
