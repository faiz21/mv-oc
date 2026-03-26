import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { normalizeRole } from '@/lib/roles'
import type { Json } from '@/types/database'

export async function PUT(
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
  const role = normalizeRole(profile?.role)
  if (!['admin', 'officer'].includes(role)) {
    return NextResponse.json({ error: 'Only officers and admins can update Wiki articles.' }, { status: 403 })
  }

  const body = (await request.json()) as {
    title?: string
    category?: string
    description?: string
    content?: string
    status?: 'draft' | 'review'
    changeSummary?: string
  }

  const existingResult = await admin
    .from('wiki_articles')
    .select('id, title, category, content, status, author_id')
    .eq('id', id)
    .maybeSingle()

  if (!existingResult.data) {
    return NextResponse.json({ error: 'Article not found.' }, { status: 404 })
  }

  const existing = existingResult.data
  const isOwner = existing.author_id === user.id

  if (role !== 'admin' && !isOwner) {
    return NextResponse.json({ error: 'You can only edit your own articles.' }, { status: 403 })
  }

  if (role !== 'admin' && existing.status !== 'draft') {
    return NextResponse.json({ error: 'Only admins can edit an article once it has entered review.' }, { status: 403 })
  }

  const nowIso = new Date().toISOString()
  const newStatus = body.status === 'review' ? 'review' : 'draft'
  const newContent = body.content ?? existing.content
  const nextTitle = body.title?.trim() || existing.title
  const nextCategory = body.category?.trim() || existing.category

  const updatePayload: Record<string, unknown> = {
    updated_at: nowIso,
    status: newStatus,
    editor_id: user.id,
  }
  if (body.title !== undefined) {
    updatePayload.title = nextTitle
    updatePayload.slug = nextTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }
  if (body.category !== undefined) updatePayload.category = nextCategory
  if (body.content !== undefined) updatePayload.content = body.content

  const { error: updateError } = await admin.from('wiki_articles').update(updatePayload).eq('id', id)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

  if (body.content !== undefined) {
    const currentVersionResult = await admin
      .from('wiki_versions')
      .select('id, version_number')
      .eq('article_id', id)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextVersion = (currentVersionResult.data?.version_number ?? 0) + 1
    await admin.from('wiki_versions').insert({
      article_id: id,
      version_number: nextVersion,
      content: newContent,
      change_summary: body.changeSummary?.trim() || null,
      edited_by: user.id,
    })
  }

  await admin.from('audit_log').insert({
    entity_type: 'wiki_article',
    entity_id: id,
    actor_type: 'human',
    actor_ref: user.id,
    event: existing.status === newStatus ? 'article:updated' : 'article:submitted_for_review',
    data: {
      previous_status: existing.status,
      status: newStatus,
      change_summary: body.changeSummary?.trim() || null,
    } as Json,
  })

  if (newStatus === 'review' && existing.status !== 'review') {
    await admin.from('approval_queue').insert({
      source_type: 'wiki_article',
      source_ref: id,
      gate_type: 'document',
      content: {
        title: nextTitle,
        status: 'review',
      } as Json,
      submitted_by: user.id,
      assigned_reviewer_id: null,
      status: 'awaiting_review',
    })
  }

  return NextResponse.json({ id, status: newStatus })
}
