import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { emoji, action } = await req.json()

  if (action === 'remove') {
    const { error } = await supabase
      .from('team_activity_reactions')
      .delete()
      .eq('team_activity_id', id)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  const { data, error } = await supabase
    .from('team_activity_reactions')
    .insert({ team_activity_id: id, user_id: user.id, emoji })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
