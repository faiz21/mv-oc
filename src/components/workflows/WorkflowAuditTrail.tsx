'use client'

import { useEffect, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { getWorkflowAuditTrail, type AuditTrailEvent } from '@/features/workflows/api'

interface WorkflowAuditTrailProps {
  workflowId: string
}

export function WorkflowAuditTrail({ workflowId }: WorkflowAuditTrailProps) {
  const [events, setEvents] = useState<AuditTrailEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getWorkflowAuditTrail(workflowId).then((result) => {
      if (cancelled) return
      if (result.ok) {
        setEvents(result.data.events)
      } else {
        setError(result.errors.join(', '))
      }
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [workflowId])

  function exportCsv() {
    const header = 'Timestamp,Event,Actor,Details'
    const rows = events.map((e) =>
      [e.timestamp, e.eventType, e.actor, JSON.stringify(e.changeDetails ?? {})].join(','),
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `audit-trail-${workflowId}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const eventTypeColors: Record<string, string> = {
    version_created: 'var(--primary)',
    activated: 'var(--status-active)',
    deactivated: 'var(--on-surface-variant)',
    sandbox_tested: 'var(--tertiary)',
    restored: '#8b5cf6',
    deleted: '#ef4444',
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-sm" style={{ color: 'var(--secondary)' }}>
        Loading audit trail...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[18px] px-4 py-3 text-sm" style={{ background: 'rgba(248,113,113,0.14)', color: '#ef4444' }}>
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--on-surface-variant)' }}>
          <FileText size={12} />
          Audit trail
        </div>
        {events.length > 0 && (
          <button
            onClick={exportCsv}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors hover:bg-white/5"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            <Download size={11} />
            Export CSV
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div
          className="rounded-[22px] px-4 py-6 text-center text-sm"
          style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--secondary)' }}
        >
          No audit events recorded yet.
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-[18px] px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: eventTypeColors[event.eventType] ?? 'var(--secondary)' }}
                  />
                  <span className="text-[13px] font-medium" style={{ color: 'var(--on-surface)' }}>
                    {event.eventType.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                  {new Date(event.timestamp).toLocaleString('en-US')}
                </span>
              </div>
              <div className="mt-1 text-[12px]" style={{ color: 'var(--secondary)' }}>
                by {event.actor}
              </div>
              {event.changeDetails && Object.keys(event.changeDetails).length > 0 && (
                <div className="mt-2 rounded-[12px] px-3 py-2 font-mono text-[11px]" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
                  {JSON.stringify(event.changeDetails, null, 2)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
