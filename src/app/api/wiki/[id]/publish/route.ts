import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdminSurface } from '@/lib/roles'
import { canPublishArticle, type WikiArticleRecord } from '@/features/wiki/wiki-content'
import type { Json } from '@/types/database'

export async function POST(
  _request: Request,
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
    return NextResponse.json({ error: 'Only admins can publish Wiki articles.' }, { status: 403 })
  }

  const articleResult = await admin
    .from('wiki_articles')
    .select('id, title, category, content, status, author_id, published_at, archived_at, deleted_at, updated_at')
    .eq('id', id)
    .maybeSingle()

  if (!articleResult.data) return NextResponse.json({ error: 'Article not found.' }, { status: 404 })

  const article = articleResult.data
  const canPublish = canPublishArticle(
    {
      id: article.id,
      title: article.title,
      category: article.category,
      description: null,
      content: article.content,
      status: article.status as WikiArticleRecord['status'],
      authorId: article.author_id,
      source: 'database',
      sourcePath: null,
      publishedAt: article.published_at,
      archivedAt: article.archived_at,
      deletedAt: article.deleted_at,
      updatedAt: article.updated_at,
    },
    user.id,
    article.author_id,
  )

  if (!canPublish) {
    return NextResponse.json({ error: 'This article cannot be published by the current reviewer.' }, { status: 403 })
  }

  const nowIso = new Date().toISOString()
  await admin.from('wiki_articles').update({
    status: 'published',
    editor_id: user.id,
    published_at: nowIso,
    updated_at: nowIso,
  }).eq('id', id)

  const currentVersionResult = await admin
    .from('wiki_versions')
    .select('version_number')
    .eq('article_id', id)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  await admin.from('wiki_versions').insert({
    article_id: id,
    version_number: (currentVersionResult.data?.version_number ?? 0) + 1,
    content: article.content,
    change_summary: 'Published',
    edited_by: user.id,
  })

  await admin.from('memory_documents').delete().eq('scope', 'wiki_article').eq('scope_ref', id)
  await admin.from('memory_documents').insert({
    scope: 'wiki_article',
    scope_ref: id,
    doc_type: 'wiki_article',
    title: articleResult.data.title,
    markdown_content: articleResult.data.content,
    source_kind: 'projection',
    source_ref: id,
    is_active: true,
    updated_at: nowIso,
  })

  await admin
    .from('approval_queue')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      decision: 'approved',
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
    event: 'article:published',
    data: {
      category: article.category,
      title: article.title,
    } as Json,
  })

  return NextResponse.json({ ok: true })
}
