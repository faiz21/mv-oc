import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireAuthUser } from '@/lib/data/auth'
import { createClient } from '@/lib/supabase/server'
import { filterArticlesByCategory, paginateSearchResults } from '@/features/wiki/wiki-content'
import { listVisibleWikiArticles } from '@/features/wiki/wiki-server'
import { WikiSearchResults } from '@/components/wiki/WikiSearchResults'
import { WikiSearchForm } from '@/components/wiki/WikiSearchForm'

interface Props {
  searchParams: Promise<{
    q?: string
    page?: string
    category?: string
  }>
}

export default async function WikiSearchPage({ searchParams }: Props) {
  const user = await requireAuthUser()
  const supabase = await createClient()
  const { q = '', page = '1', category } = await searchParams
  const query = q.trim()

  const data = await listVisibleWikiArticles(supabase, {
    role: user.role,
    userId: user.id,
    search: query,
    status: 'all',
  })

  const currentPage = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1
  const filteredResults = filterArticlesByCategory(data.searchResults, category)
  const pagedResults = paginateSearchResults(filteredResults, currentPage, 10)

  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border px-6 py-6" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/wiki" className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--secondary)' }}>
              <ArrowLeft size={16} />
              Back to Wiki
            </Link>
            <h1 className="mt-3 text-3xl font-semibold" style={{ color: 'var(--on-surface)' }}>
              Search Wiki
            </h1>
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--secondary)' }}>
              Search runs across published source docs and the article records you are allowed to read.
            </p>
          </div>
        </div>
        <div className="mt-5">
          <WikiSearchForm defaultValue={query} category={category ?? null} />
        </div>
      </section>

      <WikiSearchResults page={pagedResults} query={query} category={category ?? null} />
    </div>
  )
}
