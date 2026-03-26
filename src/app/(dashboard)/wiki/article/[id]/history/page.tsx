import Link from 'next/link'
import { forbidden, notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireAuthUser } from '@/lib/data/auth'
import { createClient } from '@/lib/supabase/server'
import { getWikiArticle, getWikiVersions } from '@/features/wiki/wiki-server'

interface Props {
  params: Promise<{ id: string }>
}

export default async function WikiArticleHistoryPage({ params }: Props) {
  const user = await requireAuthUser()
  const supabase = await createClient()
  const { id } = await params

  const data = await getWikiArticle(supabase, decodeURIComponent(id), {
    role: user.role,
    userId: user.id,
  })

  if (!data) notFound()
  if (data.article.source !== 'database') {
    forbidden()
  }

  const versions = await getWikiVersions(supabase, data.article.id)

  return (
    <div className="grid gap-6">
      <section className="rounded-[28px] border px-6 py-6" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
        <Link href={`/wiki/article/${encodeURIComponent(data.article.id)}`} className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--secondary)' }}>
          <ArrowLeft size={16} />
          Back to article
        </Link>
        <h1 className="mt-3 text-3xl font-semibold" style={{ color: 'var(--on-surface)' }}>
          Version History
        </h1>
        <p className="mt-2 text-sm leading-6" style={{ color: 'var(--secondary)' }}>
          {data.article.title}
        </p>
      </section>

      <div className="grid gap-4">
        {versions.length === 0 ? (
          <div className="rounded-[28px] border px-6 py-10 text-center" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
            <p className="text-sm" style={{ color: 'var(--secondary)' }}>
              No saved versions yet.
            </p>
          </div>
        ) : (
          versions.map((version) => (
            <article key={version.id} className="rounded-[28px] border px-5 py-5" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
                    Version {version.version_number}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: 'var(--secondary)' }}>
                    Edited by {version.edited_by ?? 'unknown'} · {new Date(version.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-xs" style={{ color: 'var(--secondary)' }}>
                  {version.change_summary || 'No change summary'}
                </div>
              </div>
              <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-[22px] p-4 text-sm leading-6" style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}>
                {version.content}
              </pre>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
