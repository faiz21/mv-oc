import Link from 'next/link'
import { forbidden } from 'next/navigation'
import { FileDiff } from 'lucide-react'
import { requireAuthUser } from '@/lib/data/auth'
import { createClient } from '@/lib/supabase/server'
import { getReviewQueueArticles } from '@/features/wiki/wiki-server'
import { normalizeCategoryLabel } from '@/features/wiki/wiki-content'
import { ReviewQueueActions } from '@/components/wiki/ReviewQueueActions'

export default async function WikiReviewQueuePage() {
  const user = await requireAuthUser()
  if (user.role !== 'admin') {
    forbidden()
  }

  const supabase = await createClient()
  const reviewItems = await getReviewQueueArticles(supabase)

  return (
    <div className="grid gap-6">
      <section className="rounded-[28px] border px-6 py-6" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
        <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--primary)' }}>
          Approval Gate
        </div>
        <h1 className="mt-3 text-3xl font-semibold" style={{ color: 'var(--on-surface)' }}>
          Wiki Review Queue
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: 'var(--secondary)' }}>
          Admin review is mandatory before a draft becomes published knowledge. Each item is reviewed and actioned individually.
        </p>
      </section>

      {reviewItems.length === 0 ? (
        <div className="rounded-[28px] border px-6 py-10 text-center" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--on-surface)' }}>
            No articles awaiting review
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--secondary)' }}>
            New submissions will appear here as soon as officers route them into review.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {reviewItems.map(({ article, approval, previousVersion }) => (
            <article key={article.id} className="grid gap-5 rounded-[28px] border px-5 py-5" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--secondary)' }}>
                    {normalizeCategoryLabel(article.category)}
                  </div>
                  <Link href={`/wiki/article/${encodeURIComponent(article.id)}`} className="mt-3 block text-2xl font-semibold" style={{ color: 'var(--on-surface)' }}>
                    {article.title}
                  </Link>
                  <p className="mt-2 text-sm leading-6" style={{ color: 'var(--secondary)' }}>
                    Submitted by {approval.submitted_by ?? 'unknown'} · awaiting document approval
                  </p>
                </div>
                <ReviewQueueActions articleId={article.id} />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <section className="rounded-[24px] border px-4 py-4" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container-low)' }}>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--secondary)' }}>
                    <FileDiff size={14} />
                    Current Submission
                  </div>
                  <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-sm leading-6" style={{ color: 'var(--on-surface)' }}>
                    {article.content}
                  </pre>
                </section>

                <section className="rounded-[24px] border px-4 py-4" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container-low)' }}>
                  <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--secondary)' }}>
                    Previous Version
                  </div>
                  <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-sm leading-6" style={{ color: 'var(--on-surface)' }}>
                    {previousVersion?.content ?? 'No previous version yet. This is the first submitted draft.'}
                  </pre>
                </section>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
