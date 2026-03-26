'use client'

import { useState } from 'react'
import type { Tables } from '@/types'

type Config = Tables<'daily_routines_config'>

interface AdminSettingsFormProps {
  initialConfig: Config | null
}

export function AdminSettingsForm({ initialConfig }: AdminSettingsFormProps) {
  const [config, setConfig] = useState({
    standup_start_hour: initialConfig?.standup_start_hour ?? 8,
    standup_end_hour: initialConfig?.standup_end_hour ?? 18,
    check_in_start_hour: initialConfig?.check_in_start_hour ?? 8,
    check_in_end_hour: initialConfig?.check_in_end_hour ?? 18,
    digest_time_hour: initialConfig?.digest_time_hour ?? 23,
    digest_time_minute: initialConfig?.digest_time_minute ?? 59,
    digest_channel_discord: initialConfig?.digest_channel_discord ?? '',
    digest_channel_teams: initialConfig?.digest_channel_teams ?? '',
    digest_enabled: initialConfig?.digest_enabled ?? true,
    // CRITICAL: reminders off by default
    reminders_enabled: initialConfig?.reminders_enabled ?? false,
    reminder_time_hour: initialConfig?.reminder_time_hour ?? null as number | null,
    reminder_time_minute: initialConfig?.reminder_time_minute ?? null as number | null,
    timezone: initialConfig?.timezone ?? 'UTC',
  })

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function set<K extends keyof typeof config>(key: K, value: (typeof config)[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/daily-routines/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const d = (await res.json()) as { error?: string }

      if (!res.ok) {
        setMessage({ type: 'error', text: d.error ?? 'Failed to save' })
      } else {
        setMessage({ type: 'success', text: 'Settings saved successfully.' })
        setTimeout(() => setMessage(null), 4000)
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="rounded-[24px] p-6"
      style={{ background: 'var(--surface-container)' }}
    >
      <h2 className="mb-6 text-lg font-semibold" style={{ color: 'var(--on-surface)' }}>
        Daily Routines Settings
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Standup window */}
        <fieldset>
          <legend className="mb-3 text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--on-surface-variant)' }}>
            Standup Submission Window
          </legend>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
            <NumberInput
              label="Start Hour (0–23)"
              value={config.standup_start_hour}
              onChange={(v) => set('standup_start_hour', v)}
              min={0}
              max={23}
            />
            <NumberInput
              label="End Hour (0–23)"
              value={config.standup_end_hour}
              onChange={(v) => set('standup_end_hour', v)}
              min={0}
              max={23}
            />
          </div>
        </fieldset>

        {/* Check-in window */}
        <fieldset>
          <legend className="mb-3 text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--on-surface-variant)' }}>
            Progress Check Window
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Start Hour (0–23)"
              value={config.check_in_start_hour}
              onChange={(v) => set('check_in_start_hour', v)}
              min={0}
              max={23}
            />
            <NumberInput
              label="End Hour (0–23)"
              value={config.check_in_end_hour}
              onChange={(v) => set('check_in_end_hour', v)}
              min={0}
              max={23}
            />
          </div>
        </fieldset>

        {/* Digest timing */}
        <fieldset>
          <legend className="mb-3 text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--on-surface-variant)' }}>
            Digest Generation Time (default 23:59)
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Hour (0–23)"
              value={config.digest_time_hour}
              onChange={(v) => set('digest_time_hour', v)}
              min={0}
              max={23}
            />
            <NumberInput
              label="Minute (0–59)"
              value={config.digest_time_minute}
              onChange={(v) => set('digest_time_minute', v)}
              min={0}
              max={59}
            />
          </div>
        </fieldset>

        {/* Channels */}
        <div>
          <label className="mb-2 block text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--on-surface-variant)' }}>
            Discord Channel (channel name)
          </label>
          <input
            type="text"
            value={config.digest_channel_discord}
            onChange={(e) => set('digest_channel_discord', e.target.value)}
            placeholder="e.g. daily-digest"
            className="w-full rounded-[14px] px-4 py-3 text-[13px] outline-none"
            style={{
              background: 'var(--surface-container-low)',
              color: 'var(--on-surface)',
              border: '1px solid rgba(255,255,255,0.06)',
              minHeight: '48px',
            }}
          />
        </div>

        <div>
          <label className="mb-2 block text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--on-surface-variant)' }}>
            Teams Channel (channel name)
          </label>
          <input
            type="text"
            value={config.digest_channel_teams}
            onChange={(e) => set('digest_channel_teams', e.target.value)}
            placeholder="e.g. General"
            className="w-full rounded-[14px] px-4 py-3 text-[13px] outline-none"
            style={{
              background: 'var(--surface-container-low)',
              color: 'var(--on-surface)',
              border: '1px solid rgba(255,255,255,0.06)',
              minHeight: '48px',
            }}
          />
        </div>

        {/* Timezone */}
        <div>
          <label className="mb-2 block text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--on-surface-variant)' }}>
            Timezone (IANA format)
          </label>
          <input
            type="text"
            value={config.timezone}
            onChange={(e) => set('timezone', e.target.value)}
            placeholder="e.g. America/Los_Angeles"
            className="w-full rounded-[14px] px-4 py-3 text-[13px] outline-none"
            style={{
              background: 'var(--surface-container-low)',
              color: 'var(--on-surface)',
              border: '1px solid rgba(255,255,255,0.06)',
              minHeight: '48px',
            }}
          />
        </div>

        {/* Reminders — disabled by default, explicit admin opt-in required */}
        <div>
          <label
            className="flex cursor-pointer items-center gap-3"
          >
            <input
              type="checkbox"
              checked={config.reminders_enabled}
              onChange={(e) => {
                set('reminders_enabled', e.target.checked)
                if (!e.target.checked) {
                  set('reminder_time_hour', null)
                  set('reminder_time_minute', null)
                }
              }}
              className="h-4 w-4 rounded"
            />
            <span className="text-[13px]" style={{ color: 'var(--on-surface)' }}>
              Enable Reminders{' '}
              <span className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                (disabled by default — admin must explicitly enable)
              </span>
            </span>
          </label>

          {config.reminders_enabled && (
            <div className="mt-4 grid grid-cols-2 gap-4 pl-7">
              <NumberInput
                label="Reminder Hour (0–23)"
                value={config.reminder_time_hour ?? 8}
                onChange={(v) => set('reminder_time_hour', v)}
                min={0}
                max={23}
              />
              <NumberInput
                label="Reminder Minute (0–59)"
                value={config.reminder_time_minute ?? 0}
                onChange={(v) => set('reminder_time_minute', v)}
                min={0}
                max={59}
              />
            </div>
          )}
        </div>

        {message && (
          <div
            className="rounded-[14px] px-4 py-3 text-[13px]"
            style={{
              background:
                message.type === 'success'
                  ? 'rgba(110,231,183,0.08)'
                  : 'rgba(248,113,113,0.08)',
              color:
                message.type === 'success' ? 'var(--status-active)' : 'var(--status-failed)',
            }}
          >
            {message.type === 'success' ? '✓ ' : ''}{message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full px-6 py-3 text-[13px] font-semibold disabled:opacity-50"
          style={{ background: 'var(--primary)', color: 'var(--on-primary-container)' }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
}) {
  return (
    <div>
      <label
        className="mb-1 block text-[11px] uppercase tracking-[0.14em]"
        style={{ color: 'var(--on-surface-variant)' }}
      >
        {label}
      </label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full rounded-[14px] px-3 py-2.5 text-[13px] outline-none"
        style={{
          background: 'var(--surface-container-low)',
          color: 'var(--on-surface)',
          border: '1px solid rgba(255,255,255,0.06)',
          minHeight: '48px',
        }}
      />
    </div>
  )
}
