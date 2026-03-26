import { forbidden } from 'next/navigation'
import { requireAuthUser } from '@/lib/data/auth'
import { listSourceWikiArticles } from '@/features/wiki/wiki-server'
import { WikiImportButton } from '@/components/wiki/WikiImportButton'

export default async function WikiSettingsPage() {
  const user = await requireAuthUser()
  if (user.role !== 'admin') {
    forbidden()
  }

  const sourceArticles = await listSourceWikiArticles()

  return (
    <div className="grid gap-6">
      <section className="rounded-[28px] border px-6 py-6" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
        <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--primary)' }}>
          Settings
        </div>
        <h1 className="mt-3 text-3xl font-semibold" style={{ color: 'var(--on-surface)' }}>
          Wiki Import Controls
        </h1>
        <p className="mt-2 text-sm leading-6" style={{ color: 'var(--secondary)' }}>
          The source Markdown corpus stays in `MV-Operating System/`. Import is optional for bootstrapping app-managed drafts and review flows.
        </p>
      </section>

      <section className="rounded-[28px] border px-5 py-5" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
        <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--secondary)' }}>
          Source Files
        </div>
        <p className="mt-3 text-sm leading-6" style={{ color: 'var(--on-surface)' }}>
          `{sourceArticles.length}` markdown files currently detected under `MV-Operating System/`.
        </p>
        <div className="mt-5">
          <WikiImportButton />
        </div>
      </section>
    </div>
  )
}
