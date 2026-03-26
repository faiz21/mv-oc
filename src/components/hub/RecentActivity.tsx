'use client'

import { useState } from 'react'
import { Activity, CheckCircle2, AlertTriangle, Info, AlertOctagon } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { useHubRealtime } from '@/features/hub/contexts/HubRealtimeContext'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types'

type AuditLogRow = Tables<'audit_log'>

function getTone(event: string, entityType: string): 'success' | 'warn' | 'error' | 'info' {
  if (event.includes('fail') || event.includes('error') || event.includes('reject')) return 'error'
  if (event.includes('warn') || event.includes('stuck') || event.includes('timeout')) return 'warn'
  if (
    event.includes('complete') ||
    event.includes('success') ||
    event.includes('approve') ||
    event.includes('done')
  )
    return 'success'
  if (entityType === 'tasks' || entityType === 'task') return 'info'
  return 'info'
}

function toneToColor(tone: string): string {
  if (tone === 'success') return 'var(--status-active)'
  if (tone === 'error') return 'var(--status-failed)'
  if (tone === 'warn') return '#f97316'
  return 'var(--primary)'
}

function ActivityIcon({ tone }: { tone: string }) {
  const color = toneToColor(tone)
  const size = 13
  if (tone === 'success') return <CheckCircle2 size={size} style={{ color }} />
  if (tone === 'error') return <AlertOctagon size={size} style={{ color }} />
  if (tone === 'warn') return <AlertTriangle size={size} style={{ color }} />
  return <Info size={size} style={{ color }} />
}

function buildSummary(row: AuditLogRow): string {
  const data = (row.data ?? {}) as Record<string, unknown>
  if (typeof data.summary === 'string') return data.summary
  if (typeof data.message === 'string') return data.message
  return `${row.entity_type} — ${row.event.replace(/_/g, ' ')}`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const PAGE_SIZE = 50

export function RecentActivity() {
  const { auditLog } = useHubRealtime()
  const [extraEntries, setExtraEntries] = useState<AuditLogRow[]>([])
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const allEntries = [...auditLog, ...extraEntries].reduce<AuditLogRow[]>((acc, entry) => {
    if (!acc.find((e) => e.id === entry.id)) acc.push(entry)
    return acc
  }, [])

  async function handleLoadOlder() {
    if (isLoadingOlder || !hasMore) return
    setIsLoadingOlder(true)
    const supabase = createClient()
    const oldest = allEntries[allEntries.length - 1]
    const { data } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .lt('created_at', oldest?.created_at ?? new Date().toISOString())
      .limit(PAGE_SIZE)

    const newer = data ?? []
    if (newer.length < PAGE_SIZE) setHasMore(false)
    setExtraEntries((prev) => [...prev, ...newer])
    setIsLoadingOlder(false)
  }

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Activity size={14} style={{ color: 'var(--primary)' }} />
        <span
          className="text-[12px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          Recent Activity
        </span>
        <span
          className="ml-1 rounded-full px-2 py-0.5 text-[11px] tabular-nums"
          style={{ background: 'rgba(17,19,23,0.5)', color: 'var(--on-surface-variant)' }}
        >
          {allEntries.length}
        </span>
      </div>

      {allEntries.length === 0 ? (
        <div
          className="rounded-2xl px-5 py-8 text-center text-[13px]"
          style={{ background: 'rgba(17,19,23,0.5)', color: 'var(--secondary)' }}
        >
          No recent activity
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(17,19,23,0.5)' }}
        >
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {allEntries.map((row) => {
              const tone = getTone(row.event, row.entity_type)
              return (
                <div key={row.id} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 flex-shrink-0">
                    <ActivityIcon tone={tone} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[13px] leading-snug"
                      style={{ color: 'var(--on-surface)' }}
                    >
                      {buildSummary(row)}
                    </div>
                    <div
                      className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px]"
                      style={{ color: 'var(--on-surface-variant)' }}
                    >
                      <span className="tabular-nums">{formatTime(row.created_at)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{row.actor_type}</span>
                      {row.actor_ref && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate max-w-[120px]">{row.actor_ref}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{formatRelativeTime(row.created_at)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {hasMore && (
            <div className="border-t px-4 py-3" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <button
                type="button"
                onClick={handleLoadOlder}
                disabled={isLoadingOlder}
                className="w-full rounded-xl py-2 text-[12px] font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ color: 'var(--primary)', background: 'rgba(17,19,23,0.4)' }}
              >
                {isLoadingOlder ? 'Loading…' : 'Load older'}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
