'use client'

import { useState } from 'react'

interface EnvCheck {
  key: string
  present: boolean
  category: string
}

interface EnvironmentPanelProps {
  initialChecks: EnvCheck[]
}

export function EnvironmentPanel({ initialChecks }: EnvironmentPanelProps) {
  const [checks, setChecks] = useState(initialChecks)
  const [loading, setLoading] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/environment/health')
      if (res.ok) {
        const data = await res.json()
        setChecks(data.checks)
      }
    } finally {
      setLoading(false)
    }
  }

  const present = checks.filter((c) => c.present).length
  const missing = checks.filter((c) => !c.present).length

  // Group by category
  const categories = [...new Set(checks.map((c) => c.category))]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
            {present} present · {missing} missing · {checks.length} total checks
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="rounded-xl px-4 py-2 text-[13px] font-medium disabled:opacity-50"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {categories.map((cat) => (
        <div key={cat}>
          <h3
            className="mb-2 text-[13px] font-medium uppercase tracking-wider"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            {cat}
          </h3>
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              background: 'var(--surface-container)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {checks
              .filter((c) => c.category === cat)
              .map((check) => (
                <div
                  key={check.key}
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <span className="text-[13px] font-mono" style={{ color: 'var(--on-surface)' }}>
                    {check.key}
                  </span>
                  <span
                    className="inline-block rounded-full px-3 py-1 text-[12px] font-medium"
                    style={{
                      background: check.present ? 'rgba(167,243,208,0.14)' : 'rgba(239,68,68,0.08)',
                      color: check.present ? 'rgb(167,243,208)' : '#ef4444',
                    }}
                  >
                    {check.present ? 'Present' : 'Missing'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
