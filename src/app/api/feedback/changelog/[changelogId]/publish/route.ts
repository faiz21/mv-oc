import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdminSurface } from '@/lib/roles'

/** Publish a changelog entry (admin only, called after approval gate is approved). */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ changelogId: string }> },
) {
  const { changelogId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!canAccessAdminSurface(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check approval queue — must be approved before publish
  const { data: approval } = await supabase
    .from('approval_queue')
    .select('id, decision')
    .eq('source_type', 'changelog')
    .eq('source_ref', changelogId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!approval || approval.decision !== 'approved') {
    return NextResponse.json(
      { error: 'Changelog entry must be approved before publishing' },
      { status: 400 },
    )
  }

  const now = new Date().toISOString()

  const { error } = await supabase
    .from('changelog')
    .update({
      status: 'published',
      published_at: now,
      published_by: user.id,
      updated_at: now,
    })
    .eq('id', changelogId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('audit_log').insert({
    event: 'changelog:published',
    entity_type: 'changelog',
    entity_id: changelogId,
    actor_type: 'user',
    actor_ref: user.id,
    data: {},
  })

  return NextResponse.json({ success: true })
}
