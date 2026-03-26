import { redirect } from 'next/navigation'
import { requireAuthUser } from '@/lib/data/auth'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdminSurface } from '@/lib/roles'
import { getFeedbackMetrics, getWeeklyVolume } from '@/features/feedback-hub/feedback-data'
import { TrendsView } from '@/components/feedback-hub/TrendsView'

export default async function FeedbackTrendsPage() {
  const authUser = await requireAuthUser()
  if (!canAccessAdminSurface(authUser.role)) redirect('/dashboard/feedback-hub')

  const supabase = await createClient()
  const [metrics, weeklyVolume] = await Promise.all([
    getFeedbackMetrics(supabase),
    getWeeklyVolume(supabase, 8),
  ])

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-base font-semibold" style={{ color: 'var(--on-surface)' }}>
          Feedback Trends
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--on-surface-variant)' }}>
          Aggregated metrics and volume over time
        </p>
      </div>

      <TrendsView initialMetrics={metrics} initialVolume={weeklyVolume} />
    </div>
  )
}
