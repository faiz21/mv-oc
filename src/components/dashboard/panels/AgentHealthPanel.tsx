'use client'

import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils'
import { DashboardPanel } from '@/components/dashboard/shared/DashboardPanel'
import { StatusBadge } from '@/components/dashboard/shared/StatusBadge'
import { useDashboardRealtime } from '@/features/dashboard/hooks/use-dashboard-realtime'
import type { Tables } from '@/types'
import { AlertTriangle, ChevronDown } from 'lucide-react'

interface AgentHealthPanelProps {
  initialAgents: Tables<'agents'>[]
  agentErrorThreshold: number
  agentOfflineThresholdMinutes: number
}

type SortKey = 'status' | 'last_seen' | 'error_rate'
type SortDir = 'asc' | 'desc'

export function AgentHealthPanel({
  initialAgents,
  agentErrorThreshold,
  agentOfflineThresholdMinutes,
}: AgentHealthPanelProps) {
  const [agents, setAgents] = useState<Tables<'agents'>[]>(initialAgents)
  const [sortKey, setSortKey] = useState<SortKey>('status')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selectedAgent, setSelectedAgent] = useState<Tables<'agents'> | null>(null)

  const refetch = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('agents')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true })
    setAgents(data ?? [])
  }, [])

  useDashboardRealtime({
    onAgentChange: () => {
      void refetch()
    },
  })

  function isOffline(agent: Tables<'agents'>): boolean {
    if (!agent.last_seen) return false
    const ageMs = Date.now() - Date.parse(agent.last_seen)
    return ageMs > agentOfflineThresholdMinutes * 60 * 1000
  }

  function isHighError(agent: Tables<'agents'>): boolean {
    return (
      typeof agent.error_rate_24h === 'number' &&
      agent.error_rate_24h > agentErrorThreshold
    )
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...agents].sort((a, b) => {
    let diff = 0
    if (sortKey === 'status') {
      diff = a.status.localeCompare(b.status)
    } else if (sortKey === 'last_seen') {
      const aTs = a.last_seen ? Date.parse(a.last_seen) : 0
      const bTs = b.last_seen ? Date.parse(b.last_seen) : 0
      diff = aTs - bTs
    } else if (sortKey === 'error_rate') {
      diff = (a.error_rate_24h ?? 0) - (b.error_rate_24h ?? 0)
    }
    return sortDir === 'asc' ? diff : -diff
  })

  const alertCount = agents.filter((a) => isOffline(a) || isHighError(a)).length

  return (
    <>
      <DashboardPanel
        title="Agent Health"
        count={alertCount > 0 ? alertCount : undefined}
        isLive
        onRefresh={refetch}
      >
        {sorted.length === 0 ? (
          <div
            className="py-10 text-center text-[13px]"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            All agents healthy
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] border-collapse text-[13px]">
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    color: 'var(--on-surface-variant)',
                  }}
                >
                  <th className="pb-2 text-left text-[11px] font-medium uppercase tracking-wider">
                    Agent
                  </th>
                  <SortableHeader
                    label="Status"
                    sortKey="status"
                    currentSort={sortKey}
                    direction={sortDir}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Last Seen"
                    sortKey="last_seen"
                    currentSort={sortKey}
                    direction={sortDir}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Error Rate 24h"
                    sortKey="error_rate"
                    currentSort={sortKey}
                    direction={sortDir}
                    onSort={toggleSort}
                  />
                  <th className="pb-2 text-left text-[11px] font-medium uppercase tracking-wider">
                    Alerts
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((agent) => {
                  const offline = isOffline(agent)
                  const highErr = isHighError(agent)
                  const rowBg = highErr
                    ? 'rgba(239,68,68,0.05)'
                    : offline
                      ? 'rgba(245,158,11,0.05)'
                      : 'transparent'

                  return (
                    <tr
                      key={agent.id}
                      className="cursor-pointer transition-colors hover:bg-white/[0.02]"
                      style={{
                        background: rowBg,
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}
                      onClick={() => setSelectedAgent(agent)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ')
                          setSelectedAgent(agent)
                      }}
                    >
                      <td
                        className="py-3 pr-4 font-medium"
                        style={{ color: 'var(--on-surface)' }}
                      >
                        {agent.name}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={agent.status} />
                      </td>
                      <td
                        className="py-3 pr-4"
                        style={{ color: 'var(--on-surface-variant)' }}
                      >
                        {agent.last_seen ? formatRelativeTime(agent.last_seen) : '—'}
                      </td>
                      <td
                        className="py-3 pr-4 tabular-nums"
                        style={{
                          color: highErr ? '#fca5a5' : 'var(--on-surface)',
                          fontWeight: highErr ? 600 : 400,
                        }}
                      >
                        {agent.error_rate_24h !== null
                          ? `${agent.error_rate_24h.toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1.5">
                          {offline && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{
                                background: 'rgba(245,158,11,0.15)',
                                color: '#fcd34d',
                              }}
                            >
                              <AlertTriangle size={10} />
                              OFFLINE
                            </span>
                          )}
                          {highErr && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{
                                background: 'rgba(239,68,68,0.15)',
                                color: '#fca5a5',
                              }}
                            >
                              <AlertTriangle size={10} />
                              HIGH ERROR
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashboardPanel>

      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          isOffline={isOffline(selectedAgent)}
          isHighError={isHighError(selectedAgent)}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function SortableHeader({
  label,
  sortKey,
  currentSort,
  direction,
  onSort,
}: {
  label: string
  sortKey: SortKey
  currentSort: SortKey
  direction: SortDir
  onSort: (key: SortKey) => void
}) {
  const isActive = currentSort === sortKey
  return (
    <th className="pb-2 text-left">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider"
        style={{ color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)' }}
      >
        {label}
        <ChevronDown
          size={12}
          style={{
            transform: isActive && direction === 'asc' ? 'rotate(180deg)' : 'none',
            opacity: isActive ? 1 : 0.4,
            transition: 'transform 0.15s',
          }}
        />
      </button>
    </th>
  )
}

function AgentDetailModal({
  agent,
  isOffline,
  isHighError,
  onClose,
}: {
  agent: Tables<'agents'>
  isOffline: boolean
  isHighError: boolean
  onClose: () => void
}) {
  const capabilities = Array.isArray(agent.capabilities)
    ? (agent.capabilities as unknown[]).filter((c): c is string => typeof c === 'string')
    : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: 'var(--surface-container)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              className="text-[15px] font-semibold"
              style={{ color: 'var(--on-surface)' }}
            >
              {agent.name}
            </h2>
            <p
              className="mt-0.5 font-mono text-[11px]"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              {agent.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-white/5"
            aria-label="Close"
          >
            <span style={{ color: 'var(--on-surface-variant)' }}>✕</span>
          </button>
        </div>

        <div className="mt-4 space-y-3 text-[13px]">
          <div className="flex items-center gap-2">
            <StatusBadge status={agent.status} />
            {isOffline && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#fcd34d' }}
              >
                OFFLINE
              </span>
            )}
            {isHighError && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}
              >
                HIGH ERROR RATE
              </span>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-3">
            {[
              {
                label: 'Last Seen',
                value: agent.last_seen ? formatRelativeTime(agent.last_seen) : '—',
              },
              {
                label: 'Error Rate 24h',
                value:
                  agent.error_rate_24h !== null
                    ? `${agent.error_rate_24h.toFixed(1)}%`
                    : '—',
              },
              {
                label: 'Description',
                value: agent.description ?? '—',
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt
                  className="text-[11px] uppercase tracking-wide"
                  style={{ color: 'var(--on-surface-variant)' }}
                >
                  {label}
                </dt>
                <dd style={{ color: 'var(--on-surface)' }}>{value}</dd>
              </div>
            ))}
          </dl>

          {capabilities.length > 0 && (
            <div>
              <p
                className="text-[11px] uppercase tracking-wide"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                Capabilities
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="rounded-full px-2.5 py-0.5 text-[11px]"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--on-surface)',
                    }}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl py-2 text-[13px] font-medium transition-colors hover:opacity-80"
          style={{
            background: 'var(--surface-container-low)',
            color: 'var(--on-surface-variant)',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
