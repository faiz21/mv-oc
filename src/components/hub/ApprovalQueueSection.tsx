'use client'

import { useRouter } from 'next/navigation'
import { ShieldAlert, Clock3 } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { useHubRealtime } from '@/features/hub/contexts/HubRealtimeContext'

function ApprovalBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span
      className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full px-1.5 text-[10px] font-semibold tabular-nums"
      style={{ background: '#f97316', color: '#fff' }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

function getGateTypeLabel(gateType: string): string {
  const labels: Record<string, string> = {
    'outbound-message': 'Outbound Message',
    'task-result': 'Task Result',
    document: 'Document',
    publish: 'Publish',
    'human-input': 'Human Input',
    'result-feedback': 'Result Feedback',
  }
  return labels[gateType] ?? gateType.replace(/-/g, ' ')
}

function getSlaColor(expiresAt: string | null): string {
  if (!expiresAt) return 'var(--on-surface-variant)'
  const ms = Date.parse(expiresAt) - Date.now()
  if (ms <= 0) return 'var(--status-failed)'
  if (ms <= 4 * 60 * 60 * 1000) return '#f97316'
  return 'var(--tertiary)'
}

export function ApprovalQueueSection() {
  const { approvalQueue } = useHubRealtime()
  const router = useRouter()

  const pending = approvalQueue.filter((a) => a.status === 'awaiting_review')

  function handleItemClick(id: string) {
    router.push(`/mission-control?approval_id=${id}`)
  }

  return (
    <section id="approval-queue">
      {/* Section header */}
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert size={14} style={{ color: 'var(--primary)' }} />
        <span
          className="text-[12px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          Approval Queue
        </span>
        <ApprovalBadge count={pending.length} />
      </div>

      {pending.length === 0 ? (
        <div
          className="rounded-2xl px-5 py-8 text-center text-[13px]"
          style={{ background: 'rgba(17,19,23,0.5)', color: 'var(--secondary)' }}
        >
          No pending approvals
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map((item) => {
            const slaColor = getSlaColor(item.expires_at)
            const content = (item.content ?? {}) as Record<string, unknown>
            const title =
              typeof content.title === 'string'
                ? content.title
                : typeof content.name === 'string'
                  ? content.name
                  : item.source_ref

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.id)}
                className="group w-full rounded-2xl px-4 py-3 text-left transition-transform hover:-translate-y-0.5"
                style={{ background: 'rgba(17,19,23,0.5)' }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ background: slaColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[13px] font-medium"
                      style={{ color: 'var(--on-surface)' }}
                    >
                      {title}
                    </div>
                    <div
                      className="mt-1 flex flex-wrap items-center gap-2 text-[11px]"
                      style={{ color: 'var(--on-surface-variant)' }}
                    >
                      <span
                        className="rounded-full px-2 py-0.5"
                        style={{
                          background: `color-mix(in srgb, ${slaColor} 14%, transparent)`,
                          color: slaColor,
                        }}
                      >
                        {getGateTypeLabel(item.gate_type)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={10} />
                        {formatRelativeTime(item.created_at)}
                      </span>
                      {item.expires_at && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span style={{ color: slaColor }}>
                            Due {formatRelativeTime(item.expires_at)}
                          </span>
                        </>
                      )}
                    </div>
                    {typeof content.description === 'string' && (
                      <div
                        className="mt-1 truncate text-[12px]"
                        style={{ color: 'var(--secondary)' }}
                      >
                        {content.description}
                      </div>
                    )}
                  </div>
                  <span
                    className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: '#f97316' }}
                  >
                    Review →
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
