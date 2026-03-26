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
  const role = normalizeRole(profile?.role)
  if (!['admin', 'officer'].includes(role)) {
    return NextResponse.json({ error: 'Only officers and admins can save Wiki drafts.' }, { status: 403 })
  }

  const body = (await request.json()) as {
    id?: string
    title: string
    category: string
    description?: string
    content: string
    changeSummary?: string
    createdFrom?: 'app' | 'autosave'
  }

  if (!body.title?.trim() || !body.category?.trim() || !body.content?.trim()) {
    return NextResponse.json({ error: 'Title, category, and content are required.' }, { status: 400 })
  }

  const nowIso = new Date().toISOString()
  const articlePayload = {
    title: body.title.trim(),
    slug: body.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    category: body.category.trim(),
    content: body.content,
    status: 'draft',
    author_id: user.id,
    updated_at: nowIso,
  }

  let articleId = body.id
  if (articleId) {
    const { error } = await admin.from('wiki_articles').update(articlePayload).eq('id', articleId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  } else {
    const { data, error } = await admin.from('wiki_articles').insert(articlePayload).select('id').single()
    if (error || !data) return NextResponse.json({ error: error?.message ?? 'Unable to create the article.' }, { status: 400 })
    articleId = data.id
  }

  const currentVersionsResult = await admin
    .from('wiki_versions')
    .select('id, version_number')
    .eq('article_id', articleId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextVersion = (currentVersionsResult.data?.version_number ?? 0) + 1
  const { error: versionError } = await admin.from('wiki_versions').insert({
    article_id: articleId,
    version_number: nextVersion,
    content: body.content,
    change_summary: body.changeSummary?.trim() || null,
    edited_by: user.id,
  })

  if (versionError) return NextResponse.json({ error: versionError.message }, { status: 400 })

  return NextResponse.json({ id: articleId, status: 'draft' })
}
