import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdminSurface } from '@/lib/roles'

export async function POST() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!canAccessAdminSurface(profile?.role)) {
    return NextResponse.json({ error: 'Only admins can run the importer.' }, { status: 403 })
  }

  const sourceRoot = path.resolve(process.cwd(), '..', 'MV-Operating System')
  const files = await collectMarkdownFiles(sourceRoot)
  let importedCount = 0

  for (const filePath of files.slice(0, 200)) {
    const content = await readFile(filePath, 'utf8')
    const relative = path.relative(sourceRoot, filePath)
    const title = path.basename(relative, path.extname(relative)).replace(/[-_]/g, ' ')
    const category = path.dirname(relative).replace(/\\/g, '/')

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const articlePayload = {
      title,
      slug,
      category: category === '.' ? 'general' : category,
      content,
      status: 'draft' as const,
      author_id: user.id,
    }

    const existing = await admin
      .from('wiki_articles')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existing.data?.id) {
      await admin.from('wiki_articles').update(articlePayload).eq('id', existing.data.id)
      importedCount += 1
      continue
    }

    const { data, error } = await admin
      .from('wiki_articles')
      .insert(articlePayload)
      .select('id')
      .single()

    if (error || !data) continue

    importedCount += 1
  }

  return NextResponse.json({ importedCount })
}

async function collectMarkdownFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(root, entry.name)
    if (entry.isDirectory()) return collectMarkdownFiles(fullPath)
    if (entry.isFile() && entry.name.endsWith('.md')) return [fullPath]
    return []
  }))

  return files.flat()
}
