'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AgentDefinitionFormProps {
  definitionId?: string
  initialValue?: {
    agentKey: string
    name: string
    description: string
    roleSummary: string
    capabilities: string
    allowedTools: string
    instructionMarkdown: string
    skillName: string
    skillDescription: string
    inputSchema: string
    outputSchema: string
  }
}

export function AgentDefinitionForm({ definitionId, initialValue }: AgentDefinitionFormProps) {
  const router = useRouter()
  const [payload, setPayload] = useState({
    agentKey: initialValue?.agentKey ?? '',
    name: initialValue?.name ?? '',
    description: initialValue?.description ?? '',
    roleSummary: initialValue?.roleSummary ?? '',
    capabilities: initialValue?.capabilities ?? '[]',
    allowedTools: initialValue?.allowedTools ?? '[]',
    instructionMarkdown: initialValue?.instructionMarkdown ?? 'Follow the approved workflow contract.',
    skillName: initialValue?.skillName ?? '',
    skillDescription: initialValue?.skillDescription ?? '',
    inputSchema: initialValue?.inputSchema ?? '{\n  "type": "object"\n}',
    outputSchema: initialValue?.outputSchema ?? '{\n  "type": "object"\n}',
  })
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    const response = await fetch('/api/admin/agents/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: definitionId,
        ...payload,
      }),
    })

    const body = await response.json()
    setSaving(false)
    if (!response.ok) {
      setMessage(body.error ?? 'Unable to save the definition.')
      return
    }

    setMessage('Definition saved.')
    router.push(`/admin/agents/${body.id}`)
    router.refresh()
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[28px] border px-5 py-5" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
        <div className="grid gap-4">
          <Field label="Agent Key"><input value={payload.agentKey} onChange={(event) => setPayload((current) => ({ ...current, agentKey: event.target.value }))} className={inputClassName} /></Field>
          <Field label="Name"><input value={payload.name} onChange={(event) => setPayload((current) => ({ ...current, name: event.target.value }))} className={inputClassName} /></Field>
          <Field label="Description"><textarea value={payload.description} onChange={(event) => setPayload((current) => ({ ...current, description: event.target.value }))} className={`${inputClassName} min-h-24`} /></Field>
          <Field label="Role Summary"><textarea value={payload.roleSummary} onChange={(event) => setPayload((current) => ({ ...current, roleSummary: event.target.value }))} className={`${inputClassName} min-h-24`} /></Field>
          <Field label="Capabilities JSON"><textarea value={payload.capabilities} onChange={(event) => setPayload((current) => ({ ...current, capabilities: event.target.value }))} className={`${inputClassName} min-h-24 font-mono text-[13px]`} /></Field>
          <Field label="Allowed Tools JSON"><textarea value={payload.allowedTools} onChange={(event) => setPayload((current) => ({ ...current, allowedTools: event.target.value }))} className={`${inputClassName} min-h-24 font-mono text-[13px]`} /></Field>
          <Field label="Instruction Markdown"><textarea value={payload.instructionMarkdown} onChange={(event) => setPayload((current) => ({ ...current, instructionMarkdown: event.target.value }))} className={`${inputClassName} min-h-[220px] font-mono text-[13px]`} /></Field>
        </div>
      </section>

      <section className="rounded-[28px] border px-5 py-5" style={{ borderColor: 'var(--border-default)', background: 'rgba(255,255,255,0.03)' }}>
        <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--primary)' }}>Linked Skill Draft</div>
        <div className="mt-4 grid gap-4">
          <Field label="Skill Name"><input value={payload.skillName} onChange={(event) => setPayload((current) => ({ ...current, skillName: event.target.value }))} className={inputClassName} /></Field>
          <Field label="Skill Description"><textarea value={payload.skillDescription} onChange={(event) => setPayload((current) => ({ ...current, skillDescription: event.target.value }))} className={`${inputClassName} min-h-24`} /></Field>
          <Field label="Input Schema"><textarea value={payload.inputSchema} onChange={(event) => setPayload((current) => ({ ...current, inputSchema: event.target.value }))} className={`${inputClassName} min-h-[160px] font-mono text-[13px]`} /></Field>
          <Field label="Output Schema"><textarea value={payload.outputSchema} onChange={(event) => setPayload((current) => ({ ...current, outputSchema: event.target.value }))} className={`${inputClassName} min-h-[160px] font-mono text-[13px]`} /></Field>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => void submit()} disabled={saving} className="inline-flex rounded-full px-5 py-3 text-sm font-semibold" style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)' }}>
            Save Definition
          </button>
        </div>
        {message ? <p className="mt-4 text-sm" style={{ color: 'var(--secondary)' }}>{message}</p> : null}
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--on-surface-variant)' }}>{label}</span>
      {children}
    </label>
  )
}

const inputClassName = 'w-full rounded-[18px] border px-4 py-3 text-sm'
