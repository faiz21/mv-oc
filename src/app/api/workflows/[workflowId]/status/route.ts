import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateWorkflowStatus } from '@/features/workflows/persistence'

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
    status: 'active' | 'inactive' | 'draft'
    versionId?: string
  }

  const result = await updateWorkflowStatus(supabase, workflowId, user.id, body.status, body.versionId)

  if ('error' in result) {
    return NextResponse.json({ errors: result.error }, { status: 400 })
  }

  return NextResponse.json(result)
}
