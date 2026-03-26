import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { runId } = await params

  // RLS enforces user_id = auth.uid() for non-admins — sandbox isolation guaranteed
  const { data, error } = await supabase
    .from('sandbox_runs')
    .select('*, workflow:workflows(id, name)')
    .eq('id', runId)
    .eq('user_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  // Expose steps from the result jsonb field (stored by sandbox-run Edge Function)
  const steps = (data.result as { steps?: unknown[] } | null)?.steps ?? []

  return NextResponse.json({ ...data, steps })
}
