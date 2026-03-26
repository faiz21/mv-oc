import { forbidden } from 'next/navigation'
import { requireAuthUser } from '@/lib/data/auth'
import { createClient } from '@/lib/supabase/server'
import { getWikiCategorySuggestions } from '@/features/wiki/wiki-server'
import { ArticleEditor } from '@/components/wiki/ArticleEditor'

export default async function WikiNewPage() {
  const user = await requireAuthUser()
  if (user.role !== 'admin' && user.role !== 'officer') {
    forbidden()
  }

  const supabase = await createClient()
  const categorySuggestions = await getWikiCategorySuggestions(supabase)

  return (
    <div className="grid gap-6">
      <section className="rounded-[28px] border px-6 py-6" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
        <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--primary)' }}>
          New Draft
        </div>
        <h1 className="mt-3 text-3xl font-semibold" style={{ color: 'var(--on-surface)' }}>
          Create Wiki Article
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: 'var(--secondary)' }}>
          Drafts save into `wiki_articles`. Publishing still routes through the review queue; source Markdown under `MV-Operating System/` remains file-backed.
        </p>
      </section>

      <ArticleEditor categorySuggestions={categorySuggestions} />
    </div>
  )
}
