import { redirect } from 'next/navigation'
import { requireAuthUser } from '@/lib/data/auth'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdminSurface } from '@/lib/roles'
import { getAllFeedback } from '@/features/feedback-hub/feedback-data'
import { FeedbackInbox } from '@/components/feedback-hub/FeedbackInbox'

export default async function FeedbackInboxPage() {
  const authUser = await requireAuthUser()
  if (!canAccessAdminSurface(authUser.role)) redirect('/dashboard/feedback-hub')

  const supabase = await createClient()
  const items = await getAllFeedback(supabase)

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div>
          <h1 className="text-base font-semibold" style={{ color: 'var(--on-surface)' }}>Leadership Inbox</h1>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--on-surface-variant)' }}>
            All team feedback — triage, respond, and close
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/dashboard/feedback-hub/trends"
            className="rounded-full px-4 py-2 text-xs font-medium"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface-variant)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            Trends
          </a>
        </div>
      </div>

      {/* Inbox — fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <FeedbackInbox items={items} />
      </div>
    </div>
  )
}
