'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, X } from 'lucide-react'
import type { SurveyQuestion, QuestionType } from '@/features/feedback-hub/feedback-data'

const MAX_QUESTIONS = 5
const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'rating_scale', label: 'Rating Scale' },
  { value: 'free_text', label: 'Free Text' },
]

interface SurveyBuilderProps {
  onClose: () => void
}

export function SurveyBuilder({ onClose }: SurveyBuilderProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<SurveyQuestion[]>([
    { id: crypto.randomUUID(), text: '', type: 'multiple_choice', options: ['', ''] },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function addQuestion() {
    if (questions.length >= MAX_QUESTIONS) return
    setQuestions(prev => [
      ...prev,
      { id: crypto.randomUUID(), text: '', type: 'multiple_choice', options: ['', ''] },
    ])
  }

  function removeQuestion(idx: number) {
    setQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  function updateQuestion(idx: number, patch: Partial<SurveyQuestion>) {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...patch } : q))
  }

  function changeType(idx: number, type: QuestionType) {
    const defaults: Partial<SurveyQuestion> = { type }
    if (type === 'multiple_choice') defaults.options = ['', '']
    if (type === 'rating_scale') defaults.range = [1, 5]
    if (type === 'free_text') defaults.charLimit = 500
    updateQuestion(idx, defaults)
  }

  function addOption(idx: number) {
    const q = questions[idx]
    if (!q.options || q.options.length >= 5) return
    updateQuestion(idx, { options: [...q.options, ''] })
  }

  function removeOption(qIdx: number, optIdx: number) {
    const q = questions[qIdx]
    if (!q.options || q.options.length <= 2) return
    updateQuestion(qIdx, { options: q.options.filter((_, i) => i !== optIdx) })
  }

  function updateOption(qIdx: number, optIdx: number, value: string) {
    const q = questions[qIdx]
    if (!q.options) return
    const next = [...q.options]
    next[optIdx] = value
    updateQuestion(qIdx, { options: next })
  }

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    if (questions.some(q => !q.text.trim())) { setError('All questions must have text'); return }

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/feedback/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, questions }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to save survey')
      setSuccess(true)
      startTransition(() => router.refresh())
      setTimeout(onClose, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-medium" style={{ color: 'var(--status-active)' }}>
          Survey saved as draft.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold" style={{ color: 'var(--on-surface)' }}>Create Survey</h3>
        <button onClick={onClose} style={{ color: 'var(--on-surface-variant)' }}>
          <X size={18} />
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="block text-[11px] uppercase tracking-widest mb-2" style={{ color: 'var(--on-surface-variant)' }}>
          Title <span style={{ color: 'var(--status-failed)' }}>*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
          className="w-full rounded-[14px] px-4 py-3 text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 16 }}
          placeholder="e.g. Team Satisfaction Q2"
        />
        <div className="mt-1 text-xs text-right" style={{ color: 'var(--on-surface-variant)' }}>{title.length}/100</div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[11px] uppercase tracking-widest mb-2" style={{ color: 'var(--on-surface-variant)' }}>
          Description
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={300}
          rows={2}
          className="w-full rounded-[14px] px-4 py-3 text-sm resize-none outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 16 }}
          placeholder="Optional description for the team..."
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
            Questions ({questions.length}/{MAX_QUESTIONS})
          </label>
          <button
            onClick={addQuestion}
            disabled={questions.length >= MAX_QUESTIONS}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-40"
            style={{ background: 'rgba(255,193,116,0.10)', color: 'var(--primary)', border: '1px solid rgba(255,193,116,0.15)' }}
          >
            <Plus size={12} />
            Add Question
          </button>
        </div>

        {questions.map((q, idx) => (
          <div
            key={q.id}
            className="rounded-[18px] p-5 space-y-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Question header */}
            <div className="flex items-start gap-3">
              <span className="text-xs font-semibold mt-3" style={{ color: 'var(--on-surface-variant)' }}>
                Q{idx + 1}
              </span>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={q.text}
                  onChange={e => updateQuestion(idx, { text: e.target.value })}
                  maxLength={200}
                  className="w-full rounded-[12px] px-4 py-2.5 text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 16 }}
                  placeholder="Question text..."
                />
                {/* Type selector */}
                <div className="flex gap-2">
                  {QUESTION_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => changeType(idx, t.value)}
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        background: q.type === t.value ? 'rgba(255,193,116,0.12)' : 'rgba(255,255,255,0.04)',
                        color: q.type === t.value ? 'var(--primary)' : 'var(--on-surface-variant)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {questions.length > 1 && (
                <button onClick={() => removeQuestion(idx)} style={{ color: 'var(--on-surface-variant)', marginTop: 12 }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Multiple choice options */}
            {q.type === 'multiple_choice' && q.options && (
              <div className="space-y-2 ml-8">
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={e => updateOption(idx, optIdx, e.target.value)}
                      className="flex-1 rounded-[10px] px-3 py-2 text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 16 }}
                      placeholder={`Option ${optIdx + 1}`}
                    />
                    {q.options!.length > 2 && (
                      <button onClick={() => removeOption(idx, optIdx)} style={{ color: 'var(--on-surface-variant)' }}>
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {q.options.length < 5 && (
                  <button
                    onClick={() => addOption(idx)}
                    className="flex items-center gap-1 text-xs"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    <Plus size={11} /> Add option
                  </button>
                )}
              </div>
            )}

            {/* Rating scale */}
            {q.type === 'rating_scale' && q.range && (
              <div className="ml-8 flex items-center gap-3">
                <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Range:</span>
                <select
                  value={q.range[0]}
                  onChange={e => updateQuestion(idx, { range: [Number(e.target.value), q.range![1]] })}
                  className="rounded-[10px] px-3 py-1.5 text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {[0, 1].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>to</span>
                <select
                  value={q.range[1]}
                  onChange={e => updateQuestion(idx, { range: [q.range![0], Number(e.target.value)] })}
                  className="rounded-[10px] px-3 py-1.5 text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {[5, 10].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            )}

            {/* Free text char limit */}
            {q.type === 'free_text' && (
              <div className="ml-8 flex items-center gap-3">
                <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Char limit:</span>
                <select
                  value={q.charLimit ?? 500}
                  onChange={e => updateQuestion(idx, { charLimit: Number(e.target.value) })}
                  className="rounded-[10px] px-3 py-1.5 text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {[200, 500, 1000].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm" style={{ color: 'var(--status-failed)' }}>{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={submitting}
          className="rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
          style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)', border: '1px solid rgba(255,193,116,0.2)' }}
        >
          {submitting ? 'Saving...' : 'Save as Draft'}
        </button>
        <button
          onClick={onClose}
          className="rounded-full px-5 py-2.5 text-sm"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
