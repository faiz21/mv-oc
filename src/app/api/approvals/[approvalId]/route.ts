import { NextResponse } from 'next/server'
import { applyApprovalDecision, applyHumanInputDecision, applyResultFeedback } from '@/features/approvals/approval-actions'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ approvalId: string }> },
) {
  const { approvalId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const body = (await request.json()) as Record<string, unknown>
  const decisionType = body.decision_type as string | undefined

  if (decisionType === 'human-input') {
    const fields = (body.fields ?? {}) as Record<string, unknown>
    const result = await applyHumanInputDecision({
      approvalId,
      fields,
      userId: user.id,
      userRole: profile?.role,
    })

    if ('error' in result) {
      return NextResponse.json({ errors: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  }

  if (decisionType === 'result-feedback') {
    const rating = body.rating as 1 | 2 | 3 | 4 | 5
    const notes = (body.notes as string | undefined) ?? ''

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ errors: ['Rating must be between 1 and 5.'] }, { status: 400 })
    }

    const result = await applyResultFeedback({
      approvalId,
      rating,
      notes,
      userId: user.id,
      userRole: profile?.role,
    })

    if ('error' in result) {
      return NextResponse.json({ errors: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  }

  // Default: standard approval/rejection
  const decision = body.decision as 'approved' | 'rejected'
  const notes = (body.notes as string | undefined) ?? ''

  const result = await applyApprovalDecision({
    approvalId,
    decision,
    notes,
    userId: user.id,
    userRole: profile?.role,
  })

  if ('error' in result) {
    return NextResponse.json({ errors: result.error }, { status: 400 })
  }

  return NextResponse.json(result)
}
