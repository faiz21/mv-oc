import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const type = req.nextUrl.searchParams.get('type')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')

  let query = supabase
    .from('team_activity')
    .select('*, author:profiles(id, full_name, email), responses:team_activity_responses(count), reactions:team_activity_reactions(emoji, user_id)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { type, content } = body

    if (!type || !content) return NextResponse.json({ error: 'type and content required' }, { status: 400 })

    // Insert only columns that exist in the actual team_activity schema
    // (no visibility or closes_at — those columns do not exist in DB)
    const { data, error } = await supabase
      .from('team_activity')
      .insert({ type, content, author_id: user.id })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
