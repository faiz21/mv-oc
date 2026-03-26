'use client'

import { useState } from 'react'
import type { Tables } from '@/types'

type Profile = Pick<Tables<'profiles'>, 'id' | 'full_name' | 'status'>
type Exclusion = Tables<'daily_routines_exclusions'>

interface ExclusionsManagerProps {
  profiles: Profile[]
  initialExclusions: Exclusion[]
}

export function ExclusionsManager({ profiles, initialExclusions }: ExclusionsManagerProps) {
  const [exclusionMap, setExclusionMap] = useState<Map<string, Exclusion>>(() => {
    const m = new Map<string, Exclusion>()
    initialExclusions.forEach((e) => m.set(e.user_id, e))
    return m
  })
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggleField(
    userId: string,
    field: 'standup_disabled' | 'check_in_disabled' | 'gratitude_disabled',
  ) {
    const current = exclusionMap.get(userId) ?? {
      id: '',
      user_id: userId,
      standup_disabled: false,
      check_in_disabled: false,
      gratitude_disabled: false,
      quiet_period_start: null,
      quiet_period_end: null,
      reason: null,
      created_at: '',
      updated_at: '',
    }

    const updated = { ...current, [field]: !current[field] }

    setSaving(userId)
    setError(null)

    try {
      const res = await fetch('/api/daily-routines/exclusions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          standup_disabled: updated.standup_disabled,
          check_in_disabled: updated.check_in_disabled,
          gratitude_disabled: updated.gratitude_disabled,
          quiet_period_start: updated.quiet_period_start,
          quiet_period_end: updated.quiet_period_end,
          reason: updated.reason,
        }),
      })

      if (!res.ok) {
        const d = (await res.json()) as { error?: string }
        setError(d.error ?? 'Failed to update')
        return
      }

      const d = (await res.json()) as { exclusion?: Exclusion }
      if (d.exclusion) {
        setExclusionMap((prev) => {
          const next = new Map(prev)
          next.set(userId, d.exclusion!)
          return next
        })
      }
    } catch {
      setError('Network error. Try again.')
    } finally {
      setSaving(null)
    }
  }

  const fields: Array<{
    key: 'standup_disabled' | 'check_in_disabled' | 'gratitude_disabled'
    label: string
  }> = [
    { key: 'standup_disabled', label: 'Standup' },
    { key: 'check_in_disabled', label: 'Check-In' },
    { key: 'gratitude_disabled', label: 'Gratitude' },
  ]

  return (
    <div className="rounded-[24px] p-6" style={{ background: 'var(--surface-container)' }}>
      <h2 className="mb-1 text-lg font-semibold" style={{ color: 'var(--on-surface)' }}>
        Daily Routines Participation
      </h2>
      <p className="mb-6 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
        Toggle individual rituals per team member.
      </p>

      {error && (
        <div
          className="mb-4 rounded-[14px] px-4 py-3 text-[13px]"
          style={{ background: 'rgba(248,113,113,0.08)', color: 'var(--status-failed)' }}
        >
          {error}
        </div>
      )}

      {/* Mobile-scroll wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px] text-[13px]">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <th
                className="py-2 pr-4 text-left font-semibold text-[11px] uppercase tracking-[0.14em]"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                User
              </th>
              {fields.map((f) => (
                <th
                  key={f.key}
                  className="px-2 py-2 text-center font-semibold text-[11px] uppercase tracking-[0.14em]"
                  style={{ color: 'var(--on-surface-variant)' }}
                >
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => {
              const exclusion = exclusionMap.get(profile.id)
              const isSaving = saving === profile.id

              return (
                <tr
                  key={profile.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <td className="py-3 pr-4">
                    <span style={{ color: 'var(--on-surface)' }}>
                      {profile.full_name ?? profile.id}
                    </span>
                  </td>
                  {fields.map((f) => {
                    const isDisabled = Boolean(exclusion?.[f.key])
                    return (
                      <td key={f.key} className="px-2 py-3 text-center">
                        <button
                          onClick={() => toggleField(profile.id, f.key)}
                          disabled={isSaving}
                          className="inline-flex min-h-[36px] min-w-[56px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold transition-opacity disabled:opacity-50"
                          style={{
                            background: isDisabled
                              ? 'rgba(248,113,113,0.12)'
                              : 'rgba(110,231,183,0.12)',
                            color: isDisabled ? 'var(--status-failed)' : 'var(--status-active)',
                          }}
                        >
                          {isDisabled ? 'Off' : 'On'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {profiles.length === 0 && (
        <p className="py-6 text-center text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
          No active team members found.
        </p>
      )}
    </div>
  )
}
