import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdminSurface } from '@/lib/roles'
import type { Json } from '@/types/database'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!canAccessAdminSurface(profile?.role)) {
    return NextResponse.json({ error: 'Only admins can reject Wiki articles.' }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as { reason?: string }
  const reason = body.reason?.trim() ?? ''
  if (!reason) {
    return NextResponse.json({ error: 'A rejection reason is required.' }, { status: 400 })
  }

  const nowIso = new Date().toISOString()
  await admin.from('wiki_articles').update({
    status: 'draft',
    editor_id: user.id,
    updated_at: nowIso,
  }).eq('id', id)

  await admin
    .from('approval_queue')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      decision: 'rejected',
      notes: reason,
      decision_at: nowIso,
      updated_at: nowIso,
    })
    .eq('source_ref', id)
    .eq('status', 'awaiting_review')

  await admin.from('audit_log').insert({
    entity_type: 'wiki_article',
    entity_id: id,
    actor_type: 'human',
    actor_ref: user.id,
    event: 'article:rejected',
    data: {
      reason,
    } as Json,
  })

  return NextResponse.json({ ok: true })
}
