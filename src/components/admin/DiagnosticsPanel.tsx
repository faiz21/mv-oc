'use client'

import { useState } from 'react'
import type { DiagnosticsResult } from '@/lib/admin/diagnostics-runner'

interface DiagnosticsPanelProps {
  initial: DiagnosticsResult | null
}

function StatCard({
  label,
  value,
  status,
}: {
  label: string
  value: string
  status: 'ok' | 'warning' | 'error'
}) {
  const colors = {
    ok: { bg: 'rgba(167,243,208,0.14)', text: 'rgb(167,243,208)' },
    warning: { bg: 'rgba(255,193,116,0.14)', text: 'var(--primary)' },
    error: { bg: 'rgba(239,68,68,0.08)', text: '#ef4444' },
  }

  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: 'var(--surface-container-low)' }}
    >
      <div className="text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
        {label}
      </div>
      <div
        className="mt-1 text-[16px] font-semibold"
        style={{ color: colors[status].text }}
      >
        {value}
      </div>
    </div>
  )
}

export function DiagnosticsPanel({ initial }: DiagnosticsPanelProps) {
  const [result, setResult] = useState(initial)
  const [loading, setLoading] = useState(false)

  async function runCheck() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/diagnostics/run', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setResult(data)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          {result && (
            <p className="text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
              Last run: {new Date(result.timestamp).toLocaleString()}
            </p>
          )}
        </div>
        <button
          onClick={runCheck}
          disabled={loading}
          className="rounded-xl px-4 py-2 text-[13px] font-medium disabled:opacity-50"
          style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
        >
          {loading ? 'Running...' : 'Run Check'}
        </button>
      </div>

      {result ? (
        <>
          {/* Database */}
          <div>
            <h3 className="mb-2 text-[13px] font-medium" style={{ color: 'var(--on-surface)' }}>
              Database
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Connection"
                value={result.database.connected ? 'Connected' : 'Failed'}
                status={result.database.connected ? 'ok' : 'error'}
              />
              <StatCard
                label="Latency"
                value={`${result.database.latencyMs}ms`}
                status={result.database.latencyMs < 500 ? 'ok' : result.database.latencyMs < 2000 ? 'warning' : 'error'}
              />
            </div>
          </div>

          {/* Agents */}
          <div>
            <h3 className="mb-2 text-[13px] font-medium" style={{ color: 'var(--on-surface)' }}>
              Agents
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Total" value={String(result.agents.total)} status="ok" />
              <StatCard label="Active" value={String(result.agents.active)} status="ok" />
              <StatCard
                label="Unreachable"
                value={String(result.agents.unreachable)}
                status={result.agents.unreachable > 0 ? 'warning' : 'ok'}
              />
              <StatCard
                label="Error"
                value={String(result.agents.error)}
                status={result.agents.error > 0 ? 'error' : 'ok'}
              />
            </div>
          </div>

          {/* Tasks */}
          <div>
            <h3 className="mb-2 text-[13px] font-medium" style={{ color: 'var(--on-surface)' }}>
              Task Queue
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <StatCard
                label="Stuck"
                value={String(result.tasks.stuck)}
                status={result.tasks.stuck > 0 ? 'error' : 'ok'}
              />
              <StatCard label="Pending" value={String(result.tasks.pending)} status="ok" />
              <StatCard label="Running" value={String(result.tasks.running)} status="ok" />
              <StatCard
                label="Failed"
                value={String(result.tasks.failed)}
                status={result.tasks.failed > 0 ? 'warning' : 'ok'}
              />
            </div>
          </div>
        </>
      ) : (
        <div
          className="rounded-2xl px-5 py-10 text-center text-[13px]"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
        >
          Click "Run Check" to run system diagnostics.
        </div>
      )}
    </div>
  )
}
