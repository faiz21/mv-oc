'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Tables } from '@/types'

export function useWorkflowRunUpdates(runId: string | null) {
  const [status, setStatus] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!runId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`workflow-run-${runId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workflow_runs',
          filter: `id=eq.${runId}`,
        },
        (payload) => {
          const row = payload.new as Tables<'workflow_runs'>
          setStatus(row.status)
          setUpdatedAt(row.updated_at)
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [runId])

  return { status, updatedAt }
}

export function useApprovalQueue() {
  const [count, setCount] = useState(0)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('approval-queue-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'approval_queue',
        },
        () => {
          // Increment count on insert, caller should refetch for accuracy
          setCount((prev) => prev + 1)
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { changeCount: count }
}

export function useSystemHealth() {
  const [states, setStates] = useState<Record<string, unknown>>({})
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Fetch initial state
    supabase
      .from('system_state')
      .select('key, value')
      .then(({ data }) => {
        if (data) {
          const stateMap: Record<string, unknown> = {}
          for (const row of data) {
            stateMap[row.key] = row.value
          }
          setStates(stateMap)
        }
      })

    const channel = supabase
      .channel('system-health')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_state',
        },
        (payload) => {
          const row = payload.new as { key: string; value: unknown }
          setStates((prev) => ({ ...prev, [row.key]: row.value }))
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { states }
}

export function useAuditStream(departmentId: string | null) {
  const [recentEvents, setRecentEvents] = useState<Tables<'audit_log'>[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!departmentId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`audit-stream-${departmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_log',
        },
        (payload) => {
          const row = payload.new as Tables<'audit_log'>
          setRecentEvents((prev) => [row, ...prev].slice(0, 20))
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [departmentId])

  return { recentEvents }
}
