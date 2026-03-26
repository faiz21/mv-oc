'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Heart, ListChecks, Activity } from 'lucide-react'
import type { Tables } from '@/types'

type EntryType = 'standup' | 'check_in' | 'gratitude'
type Exclusion = Tables<'daily_routines_exclusions'>
type DailyEntry = Tables<'daily_entries'>

interface DailyRitualFormsProps {
  submittedTypes: string[]
  standupEntry?: DailyEntry | null
  checkInEntry?: DailyEntry | null
  gratitudeEntry?: DailyEntry | null
  exclusion?: Exclusion | null
}

export function DailyRitualForms({
  submittedTypes,
  standupEntry,
  checkInEntry,
  gratitudeEntry,
  exclusion,
}: DailyRitualFormsProps) {
  const [submitted, setSubmitted] = useState<Set<string>>(new Set(submittedTypes))
  const [loadingType, setLoadingType] = useState<EntryType | null>(null)
  const [errors, setErrors] = useState<Partial<Record<EntryType, string>>>({})
  const [successes, setSuccesses] = useState<Partial<Record<EntryType, string>>>({})

  async function submit(
    type: EntryType,
    content: Record<string, unknown>,
    isPublic: boolean,
  ) {
    setLoadingType(type)
    setErrors((prev) => ({ ...prev, [type]: undefined }))
    setSuccesses((prev) => ({ ...prev, [type]: undefined }))

    try {
      const res = await fetch('/api/daily-routines/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content, is_public: isPublic }),
      })
      const data = (await res.json()) as { error?: string; message?: string }

      if (!res.ok) {
        setErrors((prev) => ({ ...prev, [type]: data.error ?? 'Submission failed' }))
      } else {
        const msg = data.message ?? 'Recorded.'
        setSuccesses((prev) => ({ ...prev, [type]: msg }))
        setSubmitted((prev) => new Set([...prev, type]))
        setTimeout(() => {
          setSuccesses((prev) => ({ ...prev, [type]: undefined }))
        }, 3000)
      }
    } catch {
      setErrors((prev) => ({ ...prev, [type]: 'Network error. Please try again.' }))
    } finally {
      setLoadingType(null)
    }
  }

  const isQuietPeriod = (() => {
    if (!exclusion?.quiet_period_start || !exclusion?.quiet_period_end) return false
    const today = new Date().toISOString().slice(0, 10)
    return today >= exclusion.quiet_period_start && today <= exclusion.quiet_period_end
  })()

  return (
    <div className="space-y-6">
      {/* Standup */}
      {!exclusion?.standup_disabled && !isQuietPeriod && (
        <RitualCard
          title="Morning Standup"
          eyebrow="Daily standup"
          icon={<ListChecks size={16} />}
          done={submitted.has('standup')}
        >
          {submitted.has('standup') ? (
            <SubmittedPreview entry={standupEntry} />
          ) : (
            <StandupForm
              loading={loadingType === 'standup'}
              error={errors.standup}
              success={successes.standup}
              onSubmit={(content, isPublic) => submit('standup', content, isPublic)}
            />
          )}
        </RitualCard>
      )}

      {/* Progress Check */}
      {!exclusion?.check_in_disabled && !isQuietPeriod && (
        <RitualCard
          title="Progress Check"
          eyebrow="Task signals"
          icon={<Activity size={16} />}
          done={submitted.has('check_in')}
        >
          {submitted.has('check_in') ? (
            <SubmittedPreview entry={checkInEntry} />
          ) : (
            <CheckInForm
              loading={loadingType === 'check_in'}
              error={errors.check_in}
              success={successes.check_in}
              onSubmit={(content, isPublic) => submit('check_in', content, isPublic)}
            />
          )}
        </RitualCard>
      )}

      {/* Gratitude */}
      {!exclusion?.gratitude_disabled && !isQuietPeriod && (
        <RitualCard
          title="Daily Gratitude"
          eyebrow="Appreciation"
          icon={<Heart size={16} />}
          done={submitted.has('gratitude')}
        >
          {submitted.has('gratitude') ? (
            <SubmittedPreview entry={gratitudeEntry} />
          ) : (
            <GratitudeForm
              loading={loadingType === 'gratitude'}
              error={errors.gratitude}
              success={successes.gratitude}
              onSubmit={(content, isPublic) => submit('gratitude', content, isPublic)}
            />
          )}
        </RitualCard>
      )}

      {isQuietPeriod && (
        <div
          className="rounded-[20px] p-5 text-[13px]"
          style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--on-surface-variant)' }}
        >
          You are in a quiet period until {exclusion?.quiet_period_end}. Submissions are paused.
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// RitualCard
// ---------------------------------------------------------------------------

function RitualCard({
  title,
  eyebrow,
  icon,
  done,
  children,
}: {
  title: string
  eyebrow: string
  icon: React.ReactNode
  done: boolean
  children: React.ReactNode
}) {
  return (
    <section
      className="rounded-[30px] px-5 py-5"
      style={{ background: 'var(--surface-container)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]"
            style={{ color: done ? 'var(--status-active)' : 'var(--primary)' }}
          >
            {icon}
            {eyebrow}
          </div>
          <h2
            className="mt-2 font-display text-[20px] font-semibold tracking-[-0.03em]"
            style={{ color: 'var(--on-surface)' }}
          >
            {title}
          </h2>
        </div>
        {done && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
            style={{ background: 'rgba(110,231,183,0.12)', color: 'var(--status-active)' }}
          >
            <CheckCircle2 size={12} />
            Done
          </span>
        )}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// StandupForm
// ---------------------------------------------------------------------------

function StandupForm({
  loading,
  error,
  success,
  onSubmit,
}: {
  loading: boolean
  error?: string
  success?: string
  onSubmit: (content: Record<string, unknown>, isPublic: boolean) => void
}) {
  const [yesterday, setYesterday] = useState('')
  const [today, setToday] = useState('')
  const [blockers, setBlockers] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  const isValid = !!(yesterday.trim() || today.trim() || blockers.trim())

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    onSubmit({ yesterday, today, blockers }, isPublic)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldTextarea
        label="What did you accomplish yesterday?"
        value={yesterday}
        onChange={setYesterday}
        placeholder="Shipped the auth flow, reviewed 3 PRs..."
        rows={3}
      />
      <FieldTextarea
        label="What are you working on today?"
        value={today}
        onChange={setToday}
        placeholder="Finishing the workflow builder..."
        rows={3}
      />
      <FieldTextarea
        label="Blockers or help needed"
        value={blockers}
        onChange={setBlockers}
        placeholder="None today. / Waiting on API access..."
        rows={2}
      />
      <PublicToggle checked={isPublic} onChange={setIsPublic} />
      {error && <ErrorNote message={error} />}
      {success && <SuccessNote message={success} />}
      <SubmitButton label="Submit Standup" loading={loading} disabled={!isValid} />
    </form>
  )
}

// ---------------------------------------------------------------------------
// CheckInForm
// ---------------------------------------------------------------------------

interface Task {
  id: string
  type: string
  status: string
}

interface CheckInEntry {
  task_id: string
  task_title: string
  signal: 'green' | 'yellow' | 'red'
  comment: string
}

function CheckInForm({
  loading,
  error,
  success,
  onSubmit,
}: {
  loading: boolean
  error?: string
  success?: string
  onSubmit: (content: Record<string, unknown>, isPublic: boolean) => void
}) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const [entries, setEntries] = useState<Map<string, CheckInEntry>>(new Map())

  useEffect(() => {
    fetch('/api/daily-routines/tasks')
      .then((r) => r.json())
      .then((d: { tasks?: Task[] }) => setTasks(d.tasks ?? []))
      .catch(() => setTasks([]))
      .finally(() => setTasksLoading(false))
  }, [])

  function handleSignal(taskId: string, taskTitle: string, signal: 'green' | 'yellow' | 'red') {
    const next = new Map(entries)
    const existing = next.get(taskId)
    next.set(taskId, {
      task_id: taskId,
      task_title: taskTitle,
      signal,
      comment: existing?.comment ?? '',
    })
    setEntries(next)
  }

  function handleComment(taskId: string, comment: string) {
    const next = new Map(entries)
    const existing = next.get(taskId)
    if (!existing) return
    next.set(taskId, { ...existing, comment })
    setEntries(next)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (entries.size === 0) return
    onSubmit({ entries: Array.from(entries.values()) }, true)
  }

  if (tasksLoading) {
    return (
      <p className="text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
        Loading tasks...
      </p>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
          No active tasks today. Great work!
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskSignalCard
            key={task.id}
            task={task}
            entry={entries.get(task.id)}
            onSignal={handleSignal}
            onComment={handleComment}
          />
        ))}
      </div>
      {error && <ErrorNote message={error} />}
      {success && <SuccessNote message={success} />}
      <SubmitButton
        label="Submit Progress Check"
        loading={loading}
        disabled={entries.size === 0}
      />
    </form>
  )
}

function TaskSignalCard({
  task,
  entry,
  onSignal,
  onComment,
}: {
  task: Task
  entry?: CheckInEntry
  onSignal: (id: string, title: string, signal: 'green' | 'yellow' | 'red') => void
  onComment: (id: string, comment: string) => void
}) {
  const signals: Array<{ value: 'green' | 'yellow' | 'red'; emoji: string; label: string }> = [
    { value: 'green', emoji: '🟢', label: 'On Track' },
    { value: 'yellow', emoji: '🟡', label: 'Needs Attention' },
    { value: 'red', emoji: '🔴', label: 'Blocked' },
  ]

  return (
    <div
      className="rounded-[18px] p-4"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <p className="mb-3 text-[13px] font-medium" style={{ color: 'var(--on-surface)' }}>
        {task.type}
        <span className="ml-2 text-[11px] font-normal" style={{ color: 'var(--on-surface-variant)' }}>
          {task.status}
        </span>
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        {signals.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onSignal(task.id, task.type, s.value)}
            className="min-h-[48px] flex-1 rounded-[14px] text-[12px] font-medium transition-colors"
            style={{
              background:
                entry?.signal === s.value
                  ? s.value === 'green'
                    ? 'rgba(110,231,183,0.16)'
                    : s.value === 'yellow'
                      ? 'rgba(251,191,36,0.16)'
                      : 'rgba(248,113,113,0.16)'
                  : 'rgba(255,255,255,0.04)',
              border:
                entry?.signal === s.value
                  ? `1px solid ${s.value === 'green' ? 'rgba(110,231,183,0.3)' : s.value === 'yellow' ? 'rgba(251,191,36,0.3)' : 'rgba(248,113,113,0.3)'}`
                  : '1px solid rgba(255,255,255,0.06)',
              color: 'var(--on-surface)',
            }}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>
      <textarea
        value={entry?.comment ?? ''}
        onChange={(e) => onComment(task.id, e.target.value)}
        placeholder="Optional comment..."
        rows={1}
        className="w-full resize-none rounded-[12px] px-3 py-2 text-[12px] outline-none"
        style={{
          background: 'rgba(255,255,255,0.03)',
          color: 'var(--on-surface)',
          border: '1px solid rgba(255,255,255,0.06)',
          minHeight: '40px',
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// GratitudeForm — private by default (critical rule)
// ---------------------------------------------------------------------------

function GratitudeForm({
  loading,
  error,
  success,
  onSubmit,
}: {
  loading: boolean
  error?: string
  success?: string
  onSubmit: (content: Record<string, unknown>, isPublic: boolean) => void
}) {
  const [text, setText] = useState('')
  const [recipient, setRecipient] = useState('')
  // CRITICAL: private by default — must be explicitly toggled by user
  const [isPublic, setIsPublic] = useState(false)

  const isValid = text.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    const content: Record<string, unknown> = { text }
    // Store recipients in content.recipients[] for mention tracking
    // NOTE: gratitude_mentions table does not exist in DB schema —
    // recipients stored in content JSONB per the existing schema.
    if (recipient.trim()) {
      content.recipients = recipient
        .split(/[,;]+/)
        .map((r) => r.trim())
        .filter(Boolean)
    }
    onSubmit(content, isPublic)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldTextarea
        label="What's one thing you're grateful for or proud of today?"
        value={text}
        onChange={setText}
        placeholder="Grateful for the team's quick support on the deployment issue..."
        rows={3}
      />
      <div>
        <label
          className="mb-2 block text-[11px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          Shoutout to (optional, comma-separated)
        </label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Alex, Jordan..."
          className="w-full rounded-[18px] px-4 py-3 text-[13px] outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--on-surface)',
            border: '1px solid rgba(255,255,255,0.06)',
            minHeight: '48px',
          }}
        />
      </div>

      {/* Privacy toggle — explicit interaction required, private by default */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          onClick={() => setIsPublic((v) => !v)}
          className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
          style={{ background: isPublic ? 'var(--primary)' : 'rgba(255,255,255,0.12)' }}
        >
          <span
            className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
            style={{ transform: isPublic ? 'translateX(20px)' : 'translateX(4px)' }}
          />
        </button>
        <span className="text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
          {isPublic ? '🌍 Share with team' : '🔒 Private'}
        </span>
      </div>

      {/* Share preview — only shown when toggled to public */}
      {isPublic && text.trim() && (
        <div
          className="rounded-[14px] px-4 py-3 text-[13px]"
          style={{ background: 'rgba(255,193,116,0.08)', color: 'var(--primary)' }}
        >
          Your team will see: {text.slice(0, 120)}
          {text.length > 120 ? '...' : ''}
        </div>
      )}

      {error && <ErrorNote message={error} />}
      {success && <SuccessNote message={success} />}
      <SubmitButton label="Submit Gratitude" loading={loading} disabled={!isValid} />
    </form>
  )
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

function FieldTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div>
      <label
        className="mb-2 block text-[11px] uppercase tracking-[0.18em]"
        style={{ color: 'var(--on-surface-variant)' }}
      >
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-[18px] px-4 py-3 text-[13px] outline-none"
        style={{
          background: 'rgba(255,255,255,0.04)',
          color: 'var(--on-surface)',
          border: '1px solid rgba(255,255,255,0.06)',
          minHeight: `${rows * 24 + 24}px`,
        }}
      />
    </div>
  )
}

function PublicToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label
      className="flex cursor-pointer items-center gap-2 text-[13px]"
      style={{ color: 'var(--on-surface-variant)' }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded"
      />
      Share publicly with team
    </label>
  )
}

function SubmitButton({
  label,
  loading,
  disabled,
}: {
  label: string
  loading: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 sm:w-auto"
      style={{ background: 'var(--primary)', color: 'var(--on-primary-container)' }}
    >
      {loading ? 'Submitting...' : label}
    </button>
  )
}

function ErrorNote({ message }: { message: string }) {
  return (
    <div
      className="rounded-[14px] px-4 py-3 text-[13px]"
      style={{ background: 'rgba(248,113,113,0.08)', color: 'var(--status-failed)' }}
    >
      {message}
    </div>
  )
}

function SuccessNote({ message }: { message: string }) {
  return (
    <div
      className="rounded-[14px] px-4 py-3 text-[13px]"
      style={{ background: 'rgba(110,231,183,0.08)', color: 'var(--status-active)' }}
    >
      {message}
    </div>
  )
}

function SubmittedPreview({ entry }: { entry?: DailyEntry | null }) {
  if (!entry) return null
  const content = entry.content as Record<string, unknown>
  const lines = Object.entries(content)
    .filter(([k, v]) => k !== 'recipients' && v && typeof v === 'string' && String(v).trim())
    .map(([k, v]) => ({ key: k, value: String(v) }))

  if (lines.length === 0) return null

  return (
    <div className="space-y-3">
      {lines.map(({ key, value }) => (
        <div
          key={key}
          className="rounded-[16px] px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <div
            className="mb-1 text-[10px] uppercase tracking-[0.14em]"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            {key.replace(/_/g, ' ')}
          </div>
          <div className="text-[13px] leading-6" style={{ color: 'var(--on-surface)' }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  )
}
