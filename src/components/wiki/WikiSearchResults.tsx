import Link from 'next/link'
import type { WikiSearchPage, WikiSearchResult } from '@/features/wiki/wiki-content'
import { normalizeCategoryLabel } from '@/features/wiki/wiki-content'

interface WikiSearchResultsProps {
  page: WikiSearchPage
  query: string
  category?: string | null
}

export function WikiSearchResults({ page, query, category }: WikiSearchResultsProps) {
  if (page.total === 0) {
    return (
      <div className="rounded-[28px] border px-6 py-10 text-center" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--on-surface)' }}>
          No matching articles
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--secondary)' }}>
          Try another keyword or switch back to the category browser.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {page.items.map((result) => (
        <SearchResultCard key={result.id} result={result} query={query} />
      ))}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border px-4 py-4 text-sm" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
        <span style={{ color: 'var(--secondary)' }}>
          Page {page.page} of {page.totalPages} · {page.total} result{page.total === 1 ? '' : 's'}
        </span>
        <div className="flex gap-2">
          {page.page > 1 ? (
            <Link
              href={buildPageHref(page.page - 1, query, category)}
              className="inline-flex min-h-11 items-center rounded-full px-4 font-semibold"
              style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
            >
              Previous
            </Link>
          ) : null}
          {page.page < page.totalPages ? (
            <Link
              href={buildPageHref(page.page + 1, query, category)}
              className="inline-flex min-h-11 items-center rounded-full px-4 font-semibold"
              style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)' }}
            >
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function SearchResultCard({ result, query }: { result: WikiSearchResult; query: string }) {
  return (
    <article className="rounded-[28px] border px-5 py-5" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
      <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--secondary)' }}>
        {normalizeCategoryLabel(result.category)}
      </div>
      <Link href={`/wiki/article/${encodeURIComponent(result.id)}`} className="mt-3 block text-xl font-semibold" style={{ color: 'var(--on-surface)' }}>
        {result.title}
      </Link>
      <p className="mt-3 text-sm leading-6" style={{ color: 'var(--secondary)' }}>
        {highlightSnippet(result.snippet, query)}
      </p>
    </article>
  )
}

function highlightSnippet(snippet: string, query: string) {
  if (!query.trim()) return snippet

  const matcher = new RegExp(`(${escapeRegex(query.trim())})`, 'ig')
  const segments = snippet.split(matcher)

  return segments.map((segment, index) => {
    if (segment.toLowerCase() !== query.trim().toLowerCase()) {
      return <span key={`${segment}-${index}`}>{segment}</span>
    }

    return (
      <mark
        key={`${segment}-${index}`}
        className="rounded-sm px-1 py-0.5"
        style={{ background: 'rgba(255,193,116,0.18)', color: 'var(--primary)' }}
      >
        {segment}
      </mark>
    )
  })
}

function buildPageHref(page: number, query: string, category?: string | null) {
  const params = new URLSearchParams()
  params.set('q', query)
  params.set('page', String(page))
  if (category) params.set('category', category)
  return `/wiki/search?${params.toString()}`
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
