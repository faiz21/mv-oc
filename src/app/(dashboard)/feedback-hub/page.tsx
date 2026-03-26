import { requireAuthUser } from '@/lib/data/auth'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdminSurface } from '@/lib/roles'
import { getMyFeedback, getPublishedChangelog, getActiveSurveys } from '@/features/feedback-hub/feedback-data'
import { FeedbackSubmitForm } from '@/components/feedback-hub/FeedbackSubmitForm'
import { MyFeedbackSection } from '@/components/feedback-hub/MyFeedbackSection'
import { ChangelogSection } from '@/components/feedback-hub/ChangelogSection'
import { SurveyList } from '@/components/feedback-hub/SurveyList'

export default async function FeedbackHubPage() {
  const authUser = await requireAuthUser()
  const supabase = await createClient()
  const isAdmin = canAccessAdminSurface(authUser.role)

  const [myFeedback, changelog, activeSurveys] = await Promise.all([
    getMyFeedback(supabase),
    getPublishedChangelog(supabase),
    getActiveSurveys(supabase),
  ])

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 space-y-10">

      {/* Active Surveys — shown to all roles when surveys exist */}
      {activeSurveys.length > 0 && (
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.18em] mb-4" style={{ color: 'var(--on-surface-variant)' }}>
            Active Surveys
          </h2>
          <SurveyList surveys={activeSurveys} isAdmin={isAdmin} />
        </section>
      )}

      {/* Submit feedback */}
      <section>
        <h2 className="text-[11px] uppercase tracking-[0.18em] mb-4" style={{ color: 'var(--on-surface-variant)' }}>
          Submit Feedback
        </h2>
        <div
          className="rounded-[22px] p-6"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <FeedbackSubmitForm />
        </div>
      </section>

      {/* My feedback */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--on-surface-variant)' }}>
            My Feedback
          </h2>
          {myFeedback.length > 0 && (
            <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
              {myFeedback.length} submission{myFeedback.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <MyFeedbackSection items={myFeedback} />
      </section>

      {/* Changelog — readable by all roles */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--on-surface-variant)' }}>
            Changelog
          </h2>
          {isAdmin && (
            <div className="flex gap-2">
              <a
                href="/dashboard/feedback-hub/changelog/new"
                className="rounded-full px-3 py-1.5 text-xs font-medium"
                style={{ background: 'rgba(255,193,116,0.10)', color: 'var(--primary)', border: '1px solid rgba(255,193,116,0.15)' }}
              >
                New Entry
              </a>
            </div>
          )}
        </div>
        <ChangelogSection entries={changelog} />
      </section>

      {/* Admin shortcuts */}
      {isAdmin && (
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.18em] mb-4" style={{ color: 'var(--on-surface-variant)' }}>
            Admin Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href="/dashboard/feedback-hub/inbox"
              className="rounded-[18px] px-5 py-4 text-sm font-medium text-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--on-surface)' }}
            >
              Leadership Inbox
            </a>
            <a
              href="/dashboard/feedback-hub/trends"
              className="rounded-[18px] px-5 py-4 text-sm font-medium text-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--on-surface)' }}
            >
              Trends &amp; Metrics
            </a>
            <a
              href="/dashboard/feedback-hub/surveys"
              className="rounded-[18px] px-5 py-4 text-sm font-medium text-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--on-surface)' }}
            >
              Pulse Surveys
            </a>
          </div>
        </section>
      )}
    </div>
  )
}
