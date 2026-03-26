'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DashboardRealtimeEvent =
  | { channel: 'workflow_runs'; payload: Record<string, unknown> }
  | { channel: 'approval_queue'; payload: Record<string, unknown> }
  | { channel: 'agents'; payload: Record<string, unknown> }
  | { channel: 'audit_log'; payload: Record<string, unknown> }
  | { channel: 'governance_state'; payload: Record<string, unknown> }

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

export interface UseDashboardRealtimeOptions {
  onWorkflowRunChange?: (payload: Record<string, unknown>) => void
  onApprovalQueueChange?: (payload: Record<string, unknown>) => void
  onAgentChange?: (payload: Record<string, unknown>) => void
  onAuditLogInsert?: (payload: Record<string, unknown>) => void
  onGovernanceStateChange?: (payload: Record<string, unknown>) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_POLL_TIMEOUT_MS = 60 * 1000 // 1 minute before polling fallback
const RECONNECT_DELAY_MS = 3000

export function useDashboardRealtime(options: UseDashboardRealtimeOptions) {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('connecting')
  const [pollFallback, setPollFallback] = useState(false)

  const channelsRef = useRef<RealtimeChannel[]>([])
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectedAtRef = useRef<number | null>(null)

  // Keep latest callbacks in a ref to avoid re-subscribing on every render
  const callbacksRef = useRef(options)
  callbacksRef.current = options

  const cleanup = useCallback(() => {
    const supabase = createClient()
    for (const ch of channelsRef.current) {
      supabase.removeChannel(ch)
    }
    channelsRef.current = []

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const subscribe = useCallback(() => {
    cleanup()
    setConnectionStatus('connecting')
    setPollFallback(false)

    const supabase = createClient()
    let connectedCount = 0
    const TOTAL_CHANNELS = 5

    function onChannelConnected() {
      connectedCount += 1
      if (connectedCount === TOTAL_CHANNELS) {
        setConnectionStatus('connected')
        connectedAtRef.current = Date.now()

        // Start fallback timer
        fallbackTimerRef.current = setTimeout(() => {
          setPollFallback(true)
        }, FALLBACK_POLL_TIMEOUT_MS)
      }
    }

    function onChannelError() {
      setConnectionStatus('reconnecting')
      // Attempt reconnect after delay
      reconnectTimerRef.current = setTimeout(() => {
        subscribe()
      }, RECONNECT_DELAY_MS)
    }

    // Channel 1: workflow_runs
    const ch1 = supabase
      .channel('realtime:dashboard:workflow_runs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workflow_runs' },
        (payload) => {
          callbacksRef.current.onWorkflowRunChange?.(
            payload as unknown as Record<string, unknown>,
          )
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') onChannelConnected()
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onChannelError()
        if (status === 'CLOSED') setConnectionStatus('disconnected')
      })

    // Channel 2: approval_queue
    const ch2 = supabase
      .channel('realtime:dashboard:approval_queue')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'approval_queue',
          filter: "status=eq.awaiting_review",
        },
        (payload) => {
          callbacksRef.current.onApprovalQueueChange?.(
            payload as unknown as Record<string, unknown>,
          )
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') onChannelConnected()
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onChannelError()
      })

    // Channel 3: agents
    const ch3 = supabase
      .channel('realtime:dashboard:agents')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'agents' },
        (payload) => {
          callbacksRef.current.onAgentChange?.(
            payload as unknown as Record<string, unknown>,
          )
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') onChannelConnected()
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onChannelError()
      })

    // Channel 4: audit_log
    const ch4 = supabase
      .channel('realtime:dashboard:audit_log')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_log' },
        (payload) => {
          callbacksRef.current.onAuditLogInsert?.(
            payload as unknown as Record<string, unknown>,
          )
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') onChannelConnected()
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onChannelError()
      })

    // Channel 5: governance_state (system_state table)
    const ch5 = supabase
      .channel('realtime:dashboard:governance_state')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'system_state' },
        (payload) => {
          callbacksRef.current.onGovernanceStateChange?.(
            payload as unknown as Record<string, unknown>,
          )
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') onChannelConnected()
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onChannelError()
      })

    channelsRef.current = [ch1, ch2, ch3, ch4, ch5]
  }, [cleanup])

  useEffect(() => {
    subscribe()
    return cleanup
  }, [subscribe, cleanup])

  return { connectionStatus, pollFallback }
}
