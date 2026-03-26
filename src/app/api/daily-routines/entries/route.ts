import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/daily-routines/entries
// Query params: type, date, public_only, limit, offset
// Returns user's own entries (or public entries for team feed)
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const date = searchParams.get('date')
  const publicOnly = searchParams.get('public_only') === 'true'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  let query = supabase
    .from('daily_entries')
    .select('*, profiles(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (type) query = query.eq('type', type)
  if (date) query = query.eq('date', date)

  if (publicOnly) {
    query = query.eq('is_public', true)
  } else {
    query = query.eq('user_id', user.id)
  }

  const { data: entries, count } = await query

  return NextResponse.json({ entries: entries ?? [], total: count ?? 0 })
}
