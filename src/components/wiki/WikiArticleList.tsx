import Link from 'next/link'
import { FilePenLine, FileText, GitBranch, History } from 'lucide-react'
import type { WikiArticleRecord } from '@/features/wiki/wiki-content'
import { normalizeCategoryLabel } from '@/features/wiki/wiki-content'

interface WikiArticleListProps {
  articles: WikiArticleRecord[]
  emptyTitle: string
  emptyBody: string
  showEdit?: boolean
}

export function WikiArticleList({
  articles,
  emptyTitle,
  emptyBody,
  showEdit = false,
}: WikiArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="rounded-[28px] border px-6 py-10 text-center" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--on-surface)' }}>
          {emptyTitle}
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--secondary)' }}>
          {emptyBody}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {articles.map((article) => (
        <article
          key={article.id}
          className="rounded-[28px] border px-5 py-5"
          style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}
        >
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--secondary)' }}>
            <span>{normalizeCategoryLabel(article.category)}</span>
            <span
              className="rounded-full px-2.5 py-1"
              style={{
                background: article.source === 'source' ? 'rgba(125,211,252,0.12)' : 'rgba(255,193,116,0.12)',
                color: article.source === 'source' ? 'var(--status-info)' : 'var(--primary)',
              }}
            >
              {article.source === 'source' ? 'Source Doc' : article.status}
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link href={`/wiki/article/${encodeURIComponent(article.id)}`} className="text-xl font-semibold" style={{ color: 'var(--on-surface)' }}>
                {article.title}
              </Link>
              <p className="mt-2 text-sm leading-6" style={{ color: 'var(--secondary)' }}>
                {article.description ?? 'Open the article to read the full markdown content.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/wiki/article/${encodeURIComponent(article.id)}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"
                style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
              >
                <FileText size={16} />
                Open
              </Link>
              {article.source === 'database' ? (
                <Link
                  href={`/wiki/article/${encodeURIComponent(article.id)}/history`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"
                  style={{ background: 'var(--surface-container-low)', color: 'var(--secondary)' }}
                >
                  <History size={16} />
                  History
                </Link>
              ) : null}
              {showEdit && article.source === 'database' ? (
                <Link
                  href={`/wiki/article/${encodeURIComponent(article.id)}/edit`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"
                  style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)' }}
                >
                  <FilePenLine size={16} />
                  Edit Draft
                </Link>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--secondary)' }}>
            <span className="inline-flex items-center gap-2">
              <GitBranch size={14} />
              Updated {new Date(article.updatedAt).toLocaleString()}
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}
