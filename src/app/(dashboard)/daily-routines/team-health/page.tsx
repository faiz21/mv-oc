import { requireAuthUser } from '@/lib/data/auth'
import { canReviewOperations } from '@/lib/roles'
import { redirect } from 'next/navigation'
import { TeamHealthView } from '@/components/daily-routines/TeamHealthView'

export default async function TeamHealthPage() {
  const authUser = await requireAuthUser()

  if (!canReviewOperations(authUser.role)) {
    redirect('/daily-routines')
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <div className="mb-6">
        <h1
          className="font-display text-2xl font-semibold tracking-tight"
          style={{ color: 'var(--on-surface)' }}
        >
          Team Health
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
          Real-time snapshot of today&apos;s standup completions and task signals.
        </p>
      </div>
      <TeamHealthView />
    </div>
  )
}
