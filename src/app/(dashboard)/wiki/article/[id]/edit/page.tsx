import { forbidden, notFound } from 'next/navigation'
import { requireAuthUser } from '@/lib/data/auth'
import { createClient } from '@/lib/supabase/server'
import { getWikiArticle, getWikiCategorySuggestions } from '@/features/wiki/wiki-server'
import { ArticleEditor } from '@/components/wiki/ArticleEditor'

interface Props {
  params: Promise<{ id: string }>
}

export default async function WikiArticleEditPage({ params }: Props) {
  const user = await requireAuthUser()
  const supabase = await createClient()
  const { id } = await params

  const [data, categorySuggestions] = await Promise.all([
    getWikiArticle(supabase, decodeURIComponent(id), {
      role: user.role,
      userId: user.id,
    }),
    getWikiCategorySuggestions(supabase),
  ])

  if (!data) notFound()
  if (!data.canEdit || data.article.source !== 'database') {
    forbidden()
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[28px] border px-6 py-6" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
        <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--primary)' }}>
          Edit Draft
        </div>
        <h1 className="mt-3 text-3xl font-semibold" style={{ color: 'var(--on-surface)' }}>
          {data.article.title}
        </h1>
        <p className="mt-2 text-sm leading-6" style={{ color: 'var(--secondary)' }}>
          Draft edits save immediately and remain locked to the current author until an admin reviews the submission.
        </p>
      </section>

      <ArticleEditor
        articleId={data.article.id}
        initialStatus={data.article.status === 'review' ? 'review' : 'draft'}
        categorySuggestions={categorySuggestions}
        rejectionReason={data.rejectionReason}
        initialValue={{
          title: data.article.title,
          category: data.article.category,
          description: data.article.description ?? '',
          content: data.article.content,
        }}
      />
    </div>
  )
}
