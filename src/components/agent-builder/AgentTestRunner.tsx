'use client'

import { useState } from 'react'

export function AgentTestRunner({ definitionId }: { definitionId: string }) {
  const [mockPayload, setMockPayload] = useState('{\n  "entity": "demo"\n}')
  const [message, setMessage] = useState<string | null>(null)

  async function runTest() {
    const response = await fetch('/api/admin/agents/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ definitionId, mockPayload }),
    })

    const body = await response.json()
    if (!response.ok) {
      setMessage(body.error ?? 'Unable to start the test run.')
      return
    }

    setMessage(`Sandbox test created: ${body.id}`)
  }

  return (
    <section className="rounded-[28px] border px-5 py-5" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
      <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--primary)' }}>Sandbox Test</div>
      <textarea value={mockPayload} onChange={(event) => setMockPayload(event.target.value)} className="mt-4 min-h-[220px] w-full rounded-[18px] border px-4 py-3 font-mono text-[13px]" style={{ borderColor: 'var(--border-default)', background: 'rgba(255,255,255,0.03)' }} />
      <button type="button" onClick={() => void runTest()} className="mt-4 inline-flex rounded-full px-5 py-3 text-sm font-semibold" style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)' }}>
        Run Sandbox Test
      </button>
      {message ? <p className="mt-4 text-sm" style={{ color: 'var(--secondary)' }}>{message}</p> : null}
    </section>
  )
}
