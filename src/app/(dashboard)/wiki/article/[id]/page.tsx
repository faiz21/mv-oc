import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FilePenLine, History, ShieldCheck } from 'lucide-react'
import { requireAuthUser } from '@/lib/data/auth'
import { createClient } from '@/lib/supabase/server'
import { normalizeCategoryLabel } from '@/features/wiki/wiki-content'
import { getWikiArticle } from '@/features/wiki/wiki-server'
import { MarkdownArticle } from '@/components/wiki/MarkdownArticle'

interface Props {
  params: Promise<{ id: string }>
}

export default async function WikiArticlePage({ params }: Props) {
  const user = await requireAuthUser()
  const supabase = await createClient()
  const { id } = await params
  const data = await getWikiArticle(supabase, decodeURIComponent(id), {
    role: user.role,
    userId: user.id,
  })

  if (!data) notFound()

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-4 rounded-[28px] border px-5 py-5 lg:flex-row lg:items-center lg:justify-between" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--secondary)' }}>
            {normalizeCategoryLabel(data.article.category)}
          </div>
          {data.rejectionReason && data.article.status === 'draft' ? (
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--status-failed)' }}>
              Latest rejection note: {data.rejectionReason}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          {data.canEdit ? (
            <Link
              href={`/wiki/article/${encodeURIComponent(data.article.id)}/edit`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"
              style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)' }}
            >
              <FilePenLine size={16} />
              Edit Draft
            </Link>
          ) : null}
          {data.article.source === 'database' ? (
            <Link
              href={`/wiki/article/${encodeURIComponent(data.article.id)}/history`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"
              style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
            >
              <History size={16} />
              History
            </Link>
          ) : null}
          {user.role === 'admin' && data.article.status === 'review' ? (
            <Link
              href="/wiki/review-queue"
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"
              style={{ background: 'var(--surface-container-low)', color: 'var(--secondary)' }}
            >
              <ShieldCheck size={16} />
              Review Queue
            </Link>
          ) : null}
        </div>
      </section>

      <MarkdownArticle
        title={data.article.title}
        description={data.article.description}
        category={data.article.category}
        content={data.article.content}
        updatedAt={data.article.updatedAt}
        toc={data.toc}
        meta={(
          <>
            <span>{data.article.source === 'source' ? 'Source Doc' : data.article.status}</span>
            {data.article.source === 'database' ? <span>App Article</span> : null}
          </>
        )}
      />
    </div>
  )
}
