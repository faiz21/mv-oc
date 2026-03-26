'use client'

import { useRouter } from 'next/navigation'
import { ChangelogForm } from './ChangelogForm'
import type { FeedbackItem } from '@/features/feedback-hub/feedback-data'

interface ChangelogFormPageProps {
  feedbackItems: FeedbackItem[]
}

export function ChangelogFormPage({ feedbackItems }: ChangelogFormPageProps) {
  const router = useRouter()

  return (
    <div
      className="rounded-[22px] p-8"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <ChangelogForm
        feedbackItems={feedbackItems}
        onClose={() => router.push('/dashboard/feedback-hub')}
      />
    </div>
  )
}
