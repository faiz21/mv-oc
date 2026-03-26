'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { FieldDef } from '@/features/approvals/approval-queue'

interface HumanInputFormProps {
  approvalId: string
  fields: FieldDef[]
}

export function HumanInputForm({ approvalId, fields }: HumanInputFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string | boolean>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.type === 'checkbox' ? false : ''])),
  )
  const [isPending, setIsPending] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [notice, setNotice] = useState<string | null>(null)

  function handleChange(key: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])
    setNotice(null)

    const missing = fields
      .filter((f) => f.required)
      .filter((f) => {
        const val = values[f.key]
        return f.type === 'checkbox' ? val === false : !String(val ?? '').trim()
      })
      .map((f) => `${f.label} is required.`)

    if (missing.length > 0) {
      setErrors(missing)
      return
    }

    setIsPending(true)

    try {
      const response = await fetch(`/api/approvals/${approvalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision_type: 'human-input',
          fields: values,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setErrors(result.errors ?? ['Submission failed. Please try again.'])
        return
      }

      setNotice('Response submitted. The workflow will resume.')
      startTransition(() => router.refresh())
    } finally {
      setIsPending(false)
    }
  }

  if (fields.length === 0) {
    return (
      <div className="rounded-[22px] px-4 py-4 text-sm" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--secondary)' }}>
        No form fields defined for this step.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--on-surface-variant)' }}>
              {field.label}
              {field.required && (
                <span style={{ color: 'var(--status-failed)' }}>*</span>
              )}
            </div>

            {field.type === 'text' && (
              <input
                type="text"
                value={String(values[field.key] ?? '')}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-full rounded-[18px] px-4 py-3 text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)' }}
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                value={String(values[field.key] ?? '')}
                onChange={(e) => handleChange(field.key, e.target.value)}
                rows={4}
                className="w-full rounded-[18px] px-4 py-3 text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)' }}
              />
            )}

            {field.type === 'select' && (
              <select
                value={String(values[field.key] ?? '')}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-full rounded-[18px] px-4 py-3 text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)' }}
              >
                <option value="">Select an option</option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {field.type === 'checkbox' && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(values[field.key])}
                  onChange={(e) => handleChange(field.key, e.target.checked)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span className="text-sm" style={{ color: 'var(--secondary)' }}>
                  {field.label}
                </span>
              </div>
            )}
          </label>
        </div>
      ))}

      {errors.length > 0 && (
        <div className="rounded-[18px] px-4 py-3" style={{ background: 'rgba(248,113,113,0.12)', color: 'var(--status-failed)' }}>
          <ul className="space-y-1 text-sm">
            {errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </div>
      )}

      {notice && (
        <div className="rounded-[18px] px-4 py-3 text-sm" style={{ background: 'rgba(110,231,183,0.12)', color: 'var(--status-active)' }}>
          {notice}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
        style={{
          background: isPending ? 'rgba(255,193,116,0.2)' : 'rgba(255,193,116,0.14)',
          color: 'var(--primary)',
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? 'Submitting…' : 'Submit response'}
      </button>
    </form>
  )
}
