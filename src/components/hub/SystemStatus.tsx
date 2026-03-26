'use client'

import { useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2, Circle, Cpu, Radio, X } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { useHubRealtime } from '@/features/hub/contexts/HubRealtimeContext'
import type { Tables } from '@/types'

type AgentRow = Tables<'agents'>

/* ------------------------------------------------------------------ */
/*  Health helpers                                                     */
/* ------------------------------------------------------------------ */

type HealthLevel = 'green' | 'yellow' | 'red'

function getAgentHealth(agent: AgentRow): HealthLevel {
  if (!agent.last_seen) return 'red'
  const ageMs = Date.now() - Date.parse(agent.last_seen)
  if (agent.status === 'unreachable' || agent.status === 'error') return 'red'
  if (ageMs > 15 * 60 * 1000) return 'red'
  if (ageMs > 5 * 60 * 1000) return 'yellow'
  return 'green'
}

function getQueueDepthHealth(depth: number): HealthLevel {
  if (depth > 50) return 'red'
  if (depth >= 20) return 'yellow'
  return 'green'
}

function healthToColor(level: HealthLevel): string {
  if (level === 'green') return 'var(--status-active)'
  if (level === 'yellow') return '#f97316'
  return 'var(--status-failed)'
}

function HealthDot({ level }: { level: HealthLevel }) {
  return (
    <span
      className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
      style={{ background: healthToColor(level) }}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  Agent detail modal                                                 */
/* ------------------------------------------------------------------ */

function AgentDetailModal({
  agent,
  onClose,
}: {
  agent: AgentRow
  onClose: () => void
}) {
  const health = getAgentHealth(agent)
  const color = healthToColor(health)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-md rounded-2xl p-6"
        style={{
          background: 'var(--surface-container)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div
              className="text-[10px] uppercase tracking-[0.18em]"
              style={{ color: 'var(--primary)' }}
            >
              Agent Detail
            </div>
            <h3
              className="mt-1 text-[18px] font-semibold"
              style={{ color: 'var(--on-surface)' }}
            >
              {agent.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: 'rgba(17,19,23,0.5)' }}
            aria-label="Close"
          >
            <X size={16} style={{ color: 'var(--on-surface)' }} />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { label: 'Status', value: agent.status },
            {
              label: 'Last Seen',
              value: agent.last_seen ? formatRelativeTime(agent.last_seen) : 'Never',
            },
            {
              label: 'Health',
              value: health === 'green' ? 'Healthy' : health === 'yellow' ? 'Degraded' : 'Unreachable',
              color,
            },
            {
              label: 'Error Rate 24h',
              value: agent.error_rate_24h != null ? `${(agent.error_rate_24h * 100).toFixed(1)}%` : 'N/A',
            },
          ].map(({ label, value, color: c }) => (
            <div
              key={label}
              className="rounded-xl px-3 py-3"
              style={{ background: 'rgba(17,19,23,0.5)' }}
            >
              <div
                className="text-[10px] uppercase tracking-[0.14em]"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                {label}
              </div>
              <div
                className="mt-1 text-[14px] font-semibold capitalize"
                style={{ color: c ?? 'var(--on-surface)' }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
        {agent.description && (
          <p
            className="mt-4 text-[13px] leading-relaxed"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            {agent.description}
          </p>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function SystemStatus() {
  const { agents, taskQueueDepth, syncMode } = useHubRealtime()
  const [selectedAgent, setSelectedAgent] = useState<AgentRow | null>(null)

  const queueHealth = getQueueDepthHealth(taskQueueDepth)
  const overallGatewayHealth: HealthLevel =
    syncMode === 'live' ? 'green' : syncMode === 'polling' ? 'yellow' : 'red'

  const unhealthyAgents = agents.filter((a) => getAgentHealth(a) !== 'green').length

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Activity size={14} style={{ color: 'var(--primary)' }} />
        <span
          className="text-[12px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          System Status
        </span>
        {unhealthyAgents > 0 && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}
          >
            {unhealthyAgents} degraded
          </span>
        )}
      </div>

      <div
        className="rounded-2xl overflow-hidden divide-y"
        style={{
          background: 'rgba(17,19,23,0.5)',
          borderColor: 'rgba(255,255,255,0.04)',
        }}
      >
        {/* Gateway health */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Radio size={14} style={{ color: healthToColor(overallGatewayHealth) }} />
          <span className="flex-1 text-[13px]" style={{ color: 'var(--on-surface)' }}>
            OpenClaw Gateway
          </span>
          <div className="flex items-center gap-2">
            <HealthDot level={overallGatewayHealth} />
            <span className="text-[12px]" style={{ color: healthToColor(overallGatewayHealth) }}>
              {overallGatewayHealth === 'green'
                ? 'Healthy'
                : overallGatewayHealth === 'yellow'
                  ? 'Degraded'
                  : 'Offline'}
            </span>
          </div>
        </div>

        {/* Queue depth */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Cpu size={14} style={{ color: healthToColor(queueHealth) }} />
          <span className="flex-1 text-[13px]" style={{ color: 'var(--on-surface)' }}>
            Queue Depth
          </span>
          <div className="flex items-center gap-2">
            <HealthDot level={queueHealth} />
            <span
              className="tabular-nums text-[12px]"
              style={{ color: healthToColor(queueHealth) }}
            >
              {taskQueueDepth} pending
            </span>
          </div>
        </div>

        {/* Agents */}
        {agents.length === 0 ? (
          <div
            className="px-4 py-4 text-[13px]"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            No agents registered
          </div>
        ) : (
          agents.map((agent) => {
            const level = getAgentHealth(agent)
            const color = healthToColor(level)
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedAgent(agent)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
              >
                {level === 'green' ? (
                  <CheckCircle2 size={14} style={{ color }} />
                ) : level === 'yellow' ? (
                  <AlertTriangle size={14} style={{ color }} />
                ) : (
                  <Circle size={14} style={{ color }} />
                )}
                <span className="flex-1 truncate text-[13px]" style={{ color: 'var(--on-surface)' }}>
                  {agent.name}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <HealthDot level={level} />
                  <span className="text-[12px]" style={{ color }}>
                    {level === 'green'
                      ? agent.last_seen
                        ? formatRelativeTime(agent.last_seen)
                        : 'Online'
                      : level === 'yellow'
                        ? 'Degraded'
                        : 'Unreachable'}
                  </span>
                </div>
              </button>
            )
          })
        )}
      </div>

      {selectedAgent && (
        <AgentDetailModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}
    </section>
  )
}
