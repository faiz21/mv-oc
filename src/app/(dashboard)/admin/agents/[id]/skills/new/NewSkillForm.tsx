'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NewSkillFormProps {
  agentDefinitionId: string
}

const DISPATCH_MODES = ['sync', 'async', 'batch', 'model_invocation'] as const

const inputClassName =
  'w-full rounded-[18px] border px-4 py-3 text-sm'

const inputStyle = {
  borderColor: 'var(--border-default)',
  background: 'rgba(255,255,255,0.03)',
  color: 'var(--on-surface)',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span
        className="text-[11px] uppercase tracking-[0.18em]"
        style={{ color: 'var(--on-surface-variant)' }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}

export function NewSkillForm({ agentDefinitionId }: NewSkillFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [payload, setPayload] = useState({
    name: '',
    description: '',
    dispatch_mode: 'sync' as string,
    instruction_markdown: '# Instructions\n\nDescribe what this skill should do.',
    input_schema: '{\n  "type": "object",\n  "properties": {}\n}',
    output_schema: '{\n  "type": "object",\n  "properties": {}\n}',
  })

  function set<K extends keyof typeof payload>(key: K, value: (typeof payload)[K]) {
    setPayload((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    if (!payload.name.trim()) {
      setMessage('Skill name is required.')
      return
    }
    setSaving(true)
    setMessage(null)

    const response = await fetch('/api/agent-builder/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        agent_definition_id: agentDefinitionId,
      }),
    })

    const body = await response.json()
    setSaving(false)

    if (!response.ok) {
      setMessage(body.error ?? 'Unable to save skill.')
      return
    }

    router.push(`/admin/agents/${agentDefinitionId}`)
    router.refresh()
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      {/* Left column — identity + schemas */}
      <section
        className="rounded-[28px] border px-5 py-5"
        style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}
      >
        <div className="grid gap-4">
          <Field label="Name">
            <input
              value={payload.name}
              onChange={(e) => set('name', e.target.value)}
              className={inputClassName}
              style={inputStyle}
              placeholder="e.g. Process Invoice"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={payload.description}
              onChange={(e) => set('description', e.target.value)}
              className={`${inputClassName} min-h-24`}
              style={inputStyle}
              placeholder="Short description of what this skill does…"
            />
          </Field>

          <Field label="Dispatch Mode">
            <select
              value={payload.dispatch_mode}
              onChange={(e) => set('dispatch_mode', e.target.value)}
              className={inputClassName}
              style={inputStyle}
            >
              {DISPATCH_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Input Schema (JSON)">
            <textarea
              value={payload.input_schema}
              onChange={(e) => set('input_schema', e.target.value)}
              className={`${inputClassName} min-h-[160px] font-mono text-[13px]`}
              style={inputStyle}
            />
          </Field>

          <Field label="Output Schema (JSON)">
            <textarea
              value={payload.output_schema}
              onChange={(e) => set('output_schema', e.target.value)}
              className={`${inputClassName} min-h-[160px] font-mono text-[13px]`}
              style={inputStyle}
            />
          </Field>
        </div>
      </section>

      {/* Right column — instructions + save */}
      <section
        className="rounded-[28px] border px-5 py-5"
        style={{ borderColor: 'var(--border-default)', background: 'rgba(255,255,255,0.03)' }}
      >
        <div
          className="text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--primary)' }}
        >
          Instruction Markdown
        </div>
        <div className="mt-4">
          <textarea
            value={payload.instruction_markdown}
            onChange={(e) => set('instruction_markdown', e.target.value)}
            className={`${inputClassName} min-h-[420px] font-mono text-[13px]`}
            style={inputStyle}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving}
            className="inline-flex rounded-full px-5 py-3 text-sm font-semibold"
            style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)' }}
          >
            {saving ? 'Saving…' : 'Save Skill'}
          </button>
        </div>

        {message ? (
          <p className="mt-4 text-sm" style={{ color: 'var(--secondary)' }}>
            {message}
          </p>
        ) : null}
      </section>
    </div>
  )
}
