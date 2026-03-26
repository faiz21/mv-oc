import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/daily-routines/tasks
// Returns current user's active tasks (queued or running) for progress check form
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, type, status')
    .eq('assigned_to', user.id)
    .in('status', ['queued', 'running'])
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ tasks: tasks ?? [] })
}
