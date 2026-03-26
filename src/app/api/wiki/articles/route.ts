import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { normalizeRole } from '@/lib/roles'
import type { Json } from '@/types/database'

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = normalizeRole(profile?.role)
  if (!['admin', 'officer'].includes(role)) {
    return NextResponse.json({ error: 'Only officers and admins can create Wiki articles.' }, { status: 403 })
  }

  const body = (await request.json()) as {
    title: string
    category: string
    description?: string
    content: string
    status?: 'draft' | 'review'
    changeSummary?: string
  }

  if (!body.title?.trim() || !body.category?.trim() || !body.content?.trim()) {
    return NextResponse.json({ error: 'Title, category, and content are required.' }, { status: 400 })
  }

  const nowIso = new Date().toISOString()
  const status = body.status === 'review' ? 'review' : 'draft'
  const title = body.title.trim()
  const category = body.category.trim()
  const description = body.description?.trim() || null

  const { data, error } = await admin
    .from('wiki_articles')
    .insert({
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      category,
      content: body.content,
      status,
      author_id: user.id,
      editor_id: user.id,
      updated_at: nowIso,
    })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Unable to create the article.' }, { status: 400 })
  }

  const articleId = data.id

  await admin.from('wiki_versions').insert({
    article_id: articleId,
    version_number: 1,
    content: body.content,
    change_summary: body.changeSummary?.trim() || null,
    edited_by: user.id,
  })

  await admin.from('audit_log').insert({
    entity_type: 'wiki_article',
    entity_id: articleId,
    actor_type: 'human',
    actor_ref: user.id,
    event: 'article:created',
    data: {
      status,
      title,
      category,
    } as Json,
  })

  if (status === 'review') {
    await admin.from('approval_queue').insert({
      source_type: 'wiki_article',
      source_ref: articleId,
      gate_type: 'document',
      content: {
        title,
        description,
        status: 'review',
      } as Json,
      submitted_by: user.id,
      assigned_reviewer_id: null,
      status: 'awaiting_review',
    })

    await admin.from('audit_log').insert({
      entity_type: 'wiki_article',
      entity_id: articleId,
      actor_type: 'human',
      actor_ref: user.id,
      event: 'article:submitted_for_review',
      data: {
        change_summary: body.changeSummary?.trim() || null,
      } as Json,
    })
  }

  return NextResponse.json({ id: articleId, status })
}
