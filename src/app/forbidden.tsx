import Link from 'next/link'

export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
      <div className="w-full rounded-[32px] border px-6 py-8 text-center" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
        <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--status-failed)' }}>
          403
        </div>
        <h1 className="mt-3 text-3xl font-semibold" style={{ color: 'var(--on-surface)' }}>
          Access denied
        </h1>
        <p className="mt-3 text-sm leading-6" style={{ color: 'var(--secondary)' }}>
          This route is restricted by role. If you expected access, check the current account or contact an admin.
        </p>
        <div className="mt-6">
          <Link
            href="/wiki"
            className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold"
            style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)' }}
          >
            Return to Wiki
          </Link>
        </div>
      </div>
    </main>
  )
}
