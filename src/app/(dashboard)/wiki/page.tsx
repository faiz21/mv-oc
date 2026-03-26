import Link from 'next/link'
import { FilePenLine, Settings2, ShieldCheck } from 'lucide-react'
import { requireAuthUser } from '@/lib/data/auth'
import { createClient } from '@/lib/supabase/server'
import { filterArticlesByCategory } from '@/features/wiki/wiki-content'
import { listVisibleWikiArticles } from '@/features/wiki/wiki-server'
import { WikiCategoryExplorer } from '@/components/wiki/WikiCategoryExplorer'
import { WikiArticleList } from '@/components/wiki/WikiArticleList'
import { WikiSearchForm } from '@/components/wiki/WikiSearchForm'

interface Props {
  searchParams: Promise<{
    category?: string
  }>
}

export default async function WikiPage({ searchParams }: Props) {
  const user = await requireAuthUser()
  const supabase = await createClient()
  const { category } = await searchParams

  const data = await listVisibleWikiArticles(supabase, {
    role: user.role,
    userId: user.id,
    status: 'published',
  })

  const filteredArticles = filterArticlesByCategory(data.articles, category)
  const canWrite = user.role === 'admin' || user.role === 'officer'
  const canReview = user.role === 'admin'

  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border px-6 py-6" style={{ borderColor: 'var(--border-default)', background: 'linear-gradient(180deg, rgba(255,193,116,0.1), rgba(255,193,116,0.02))' }}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--primary)' }}>
              Module 02
            </div>
            <h1 className="mt-3 text-3xl font-semibold" style={{ color: 'var(--on-surface)' }}>
              Wiki
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: 'var(--secondary)' }}>
              Browse the shipped Markdown knowledge base, search published standards, and route draft work through review before publication.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {canWrite ? (
              <Link
                href="/wiki/new"
                className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"
                style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)' }}
              >
                <FilePenLine size={16} />
                Create Article
              </Link>
            ) : null}
            {canReview ? (
              <Link
                href="/wiki/review-queue"
                className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"
                style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
              >
                <ShieldCheck size={16} />
                Review Queue
              </Link>
            ) : null}
            {canReview ? (
              <Link
                href="/wiki/settings"
                className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"
                style={{ background: 'var(--surface-container)', color: 'var(--secondary)' }}
              >
                <Settings2 size={16} />
                Settings
              </Link>
            ) : null}
          </div>
        </div>
        <div className="mt-5">
          <WikiSearchForm category={category ?? null} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="grid gap-4">
          <WikiCategoryExplorer categories={data.categoryTree} initialCategory={category ?? null} />
          <div className="rounded-[24px] border px-4 py-4 text-sm" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
            <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--secondary)' }}>
              Snapshot
            </div>
            <div className="mt-3 grid gap-3">
              <div className="rounded-2xl px-3 py-3" style={{ background: 'var(--surface-container-low)' }}>
                <div className="text-xs" style={{ color: 'var(--secondary)' }}>Published</div>
                <div className="mt-1 text-2xl font-semibold" style={{ color: 'var(--on-surface)' }}>
                  {data.statusSummary.published}
                </div>
              </div>
              {canWrite ? (
                <div className="rounded-2xl px-3 py-3" style={{ background: 'var(--surface-container-low)' }}>
                  <div className="text-xs" style={{ color: 'var(--secondary)' }}>Drafts Visible To You</div>
                  <div className="mt-1 text-2xl font-semibold" style={{ color: 'var(--on-surface)' }}>
                    {data.statusSummary.draft}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <WikiArticleList
          articles={filteredArticles}
          emptyTitle="No articles in this category"
          emptyBody="Pick another category or open search to find knowledge elsewhere in the library."
        />
      </div>
    </div>
  )
}
