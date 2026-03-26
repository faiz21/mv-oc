import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    const { data, error } = await supabase.functions.invoke('points-award', {
      body: {
        user_id: body.user_id || user.id,
        action_type: body.action_type,
        ref_id: body.ref_id,
        ref_type: body.ref_type,
        workflow_run_id: body.workflow_run_id,
        context: body.context,
      }
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
