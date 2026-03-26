'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { SurveyList } from '@/components/feedback-hub/SurveyList'
import { SurveyBuilder } from '@/components/feedback-hub/SurveyBuilder'
import type { PulseSurvey } from '@/features/feedback-hub/feedback-data'

// This is an admin-only page — server-side auth check is in layout/middleware.
// Client component needed for the survey builder toggle.

export default function SurveysAdminPage() {
  const [surveys, setSurveys] = useState<PulseSurvey[]>([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [answeredIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    return Object.keys(window.sessionStorage)
      .filter(k => k.startsWith('survey_answered_'))
      .map(k => k.replace('survey_answered_', ''))
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/feedback/surveys/admin')
        if (res.ok) {
          const data = await res.json() as { surveys: PulseSurvey[] }
          setSurveys(data.surveys)
        }
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold" style={{ color: 'var(--on-surface)' }}>Pulse Surveys</h1>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--on-surface-variant)' }}>
            Create and manage team pulse surveys
          </p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
          style={{ background: 'rgba(255,193,116,0.12)', color: 'var(--primary)', border: '1px solid rgba(255,193,116,0.18)' }}
        >
          <Plus size={14} />
          Create Survey
        </button>
      </div>

      {/* Survey builder modal */}
      {showBuilder && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-20"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowBuilder(false) }}
        >
          <div
            className="w-full max-w-2xl rounded-[22px] p-8"
            style={{ background: 'var(--background)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <SurveyBuilder onClose={() => setShowBuilder(false)} />
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--on-surface-variant)' }}>Loading...</p>
      ) : (
        <SurveyList surveys={surveys} isAdmin answeredSurveyIds={answeredIds} />
      )}
    </div>
  )
}
