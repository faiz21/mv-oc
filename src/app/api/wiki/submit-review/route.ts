import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { normalizeRole } from '@/lib/roles'

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!['admin', 'officer'].includes(normalizeRole(profile?.role))) {
    return NextResponse.json({ error: 'Only officers and admins can submit Wiki drafts.' }, { status: 403 })
  }

  const body = (await request.json()) as { id: string }
  const articleResult = await admin.from('wiki_articles').select('id, title, status').eq('id', body.id).maybeSingle()
  if (!articleResult.data) return NextResponse.json({ error: 'Article not found.' }, { status: 404 })

  const { error: updateError } = await admin.from('wiki_articles').update({ status: 'review' }).eq('id', body.id)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

  await admin.from('approval_queue').insert({
    source_type: 'wiki_article',
    source_ref: body.id,
    gate_type: 'document',
    content: {
      title: articleResult.data.title,
      status: 'review',
    },
    submitted_by: user.id,
    assigned_reviewer_id: null,
    status: 'awaiting_review',
  })

  return NextResponse.json({ ok: true })
}
