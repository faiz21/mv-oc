'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type HubTask = Tables<'tasks'>
export type HubApprovalQueueRow = Tables<'approval_queue'>
export type HubAuditLogRow = Tables<'audit_log'>
export type HubAgent = Tables<'agents'>
export type HubTaskQueueRow = Tables<'task_queue'>

export interface HubQuoteData {
  quote: string
  author: string
  date: string
}

export type SyncMode = 'connecting' | 'live' | 'polling'

export interface HubRealtimeState {
  tasks: HubTask[]
  approvalQueue: HubApprovalQueueRow[]
  auditLog: HubAuditLogRow[]
  agents: HubAgent[]
  taskQueueDepth: number
  quote: HubQuoteData | null
  syncMode: SyncMode
  isLoading: boolean
  errors: Record<string, string>
  // Refresh helpers
  refreshTasks: () => Promise<void>
  refreshApprovalQueue: () => Promise<void>
  refreshAuditLog: () => Promise<void>
  refreshAgents: () => Promise<void>
  refreshAll: () => Promise<void>
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const HubRealtimeContext = createContext<HubRealtimeState | null>(null)

export function useHubRealtime(): HubRealtimeState {
  const ctx = useContext(HubRealtimeContext)
  if (!ctx) throw new Error('useHubRealtime must be used within HubRealtimeProvider')
  return ctx
}

/* ------------------------------------------------------------------ */
/*  Debounce helper                                                    */
/* ------------------------------------------------------------------ */

function useDebounce(fn: () => void, delayMs: number) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  return useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(fn, delayMs)
  }, [fn, delayMs])
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

const FALLBACK_QUOTE: HubQuoteData = {
  quote: 'The secret of getting ahead is getting started.',
  author: 'Mark Twain',
  date: new Date().toISOString().slice(0, 10),
}

const DISCONNECT_TIMEOUT_MS = 60_000 // 1 minute
const POLL_INTERVAL_MS = 10_000

interface HubRealtimeProviderProps {
  children: React.ReactNode
  /** Initial data from server render to hydrate state immediately */
  initialTasks?: HubTask[]
  initialApprovalQueue?: HubApprovalQueueRow[]
  initialAuditLog?: HubAuditLogRow[]
  initialAgents?: HubAgent[]
  initialTaskQueueDepth?: number
  initialQuote?: HubQuoteData | null
  /** Filter: only show tasks for this department */
  departmentId?: string
  /** Filter: show only tasks assigned to this user */
  userId?: string
}

export function HubRealtimeProvider({
  children,
  initialTasks = [],
  initialApprovalQueue = [],
  initialAuditLog = [],
  initialAgents = [],
  initialTaskQueueDepth = 0,
  initialQuote = null,
  departmentId,
  userId,
}: HubRealtimeProviderProps) {
  const [tasks, setTasks] = useState<HubTask[]>(initialTasks)
  const [approvalQueue, setApprovalQueue] = useState<HubApprovalQueueRow[]>(initialApprovalQueue)
  const [auditLog, setAuditLog] = useState<HubAuditLogRow[]>(initialAuditLog)
  const [agents, setAgents] = useState<HubAgent[]>(initialAgents)
  const [taskQueueDepth, setTaskQueueDepth] = useState(initialTaskQueueDepth)
  const [quote, setQuote] = useState<HubQuoteData | null>(initialQuote ?? FALLBACK_QUOTE)
  const [syncMode, setSyncMode] = useState<SyncMode>('connecting')
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const disconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ---------- fetch helpers ---------- */

  const fetchTasks = useCallback(async () => {
    const supabase = createClient()
    let query = supabase
      .from('tasks')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(100)

    if (departmentId) query = query.eq('department_id', departmentId)
    if (userId) query = query.eq('assigned_to', userId)

    const { data, error } = await query
    if (error) {
      setErrors((prev) => ({ ...prev, tasks: error.message }))
    } else {
      setErrors((prev) => { const next = { ...prev }; delete next.tasks; return next })
      setTasks(data ?? [])
    }
  }, [departmentId, userId])

  const fetchApprovalQueue = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('approval_queue')
      .select('*')
      .eq('status', 'awaiting_review')
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) {
      setErrors((prev) => ({ ...prev, approvalQueue: error.message }))
    } else {
      setErrors((prev) => { const next = { ...prev }; delete next.approvalQueue; return next })
      setApprovalQueue(data ?? [])
    }
  }, [])

  const fetchAuditLog = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      setErrors((prev) => ({ ...prev, auditLog: error.message }))
    } else {
      setErrors((prev) => { const next = { ...prev }; delete next.auditLog; return next })
      setAuditLog(data ?? [])
    }
  }, [])

  const fetchAgents = useCallback(async () => {
    const supabase = createClient()
    let query = supabase
      .from('agents')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (departmentId) query = query.eq('department_id', departmentId)

    const { data, error } = await query
    if (error) {
      setErrors((prev) => ({ ...prev, agents: error.message }))
    } else {
      setErrors((prev) => { const next = { ...prev }; delete next.agents; return next })
      setAgents(data ?? [])
    }
  }, [departmentId])

  const fetchTaskQueueDepth = useCallback(async () => {
    const supabase = createClient()
    const { count } = await supabase
      .from('task_queue')
      .select('*', { count: 'exact', head: true })
      .is('released_at', null)

    setTaskQueueDepth(count ?? 0)
  }, [])

  const fetchQuote = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('memory_documents')
      .select('*')
      .eq('scope', 'global')
      .eq('doc_type', 'daily_quote')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      try {
        const parsed = JSON.parse(data.markdown_content) as HubQuoteData
        if (parsed.quote && parsed.author) {
          setQuote(parsed)
          return
        }
      } catch {
        // fall through to fallback
      }
    }
    setQuote(FALLBACK_QUOTE)
  }, [])

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([
      fetchTasks(),
      fetchApprovalQueue(),
      fetchAuditLog(),
      fetchAgents(),
      fetchTaskQueueDepth(),
      fetchQuote(),
    ])
  }, [fetchTasks, fetchApprovalQueue, fetchAuditLog, fetchAgents, fetchTaskQueueDepth, fetchQuote])

  /* ---------- debounced handlers ---------- */

  const debouncedRefreshTasks = useDebounce(fetchTasks, 100)
  const debouncedRefreshAuditLog = useDebounce(fetchAuditLog, 100)
  const debouncedRefreshAgents = useDebounce(fetchAgents, 500)
  const debouncedRefreshApproval = useDebounce(fetchApprovalQueue, 100)
  const debouncedRefreshTaskQueue = useDebounce(fetchTaskQueueDepth, 1000)

  /* ---------- Realtime subscriptions ---------- */

  useEffect(() => {
    let mounted = true
    let liveCount = 0

    // Initial fetch
    void refreshAll().then(() => {
      if (mounted) setIsLoading(false)
    })

    const supabase = createClient()

    function onConnected() {
      liveCount++
      if (mounted) {
        setSyncMode('live')
        // Clear the disconnect timer
        if (disconnectTimer.current) {
          clearTimeout(disconnectTimer.current)
          disconnectTimer.current = null
        }
      }
    }

    function onDisconnected() {
      liveCount = Math.max(0, liveCount - 1)
      if (liveCount === 0 && mounted) {
        setSyncMode('connecting')
        // Start disconnect timer — if offline for > 1 min, switch to polling
        if (!disconnectTimer.current) {
          disconnectTimer.current = setTimeout(() => {
            if (mounted) setSyncMode('polling')
          }, DISCONNECT_TIMEOUT_MS)
        }
      }
    }

    const taskChannel = supabase
      .channel('hub:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        debouncedRefreshTasks()
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') onConnected()
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED')
          onDisconnected()
      })

    const approvalChannel = supabase
      .channel('hub:approval_queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approval_queue' }, () => {
        debouncedRefreshApproval()
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') onConnected()
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED')
          onDisconnected()
      })

    const auditChannel = supabase
      .channel('hub:audit_log')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' }, (payload) => {
        const row = payload.new as HubAuditLogRow
        setAuditLog((prev) => [row, ...prev].slice(0, 50))
        debouncedRefreshAuditLog()
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') onConnected()
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED')
          onDisconnected()
      })

    const agentChannel = supabase
      .channel('hub:agents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, () => {
        debouncedRefreshAgents()
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') onConnected()
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED')
          onDisconnected()
      })

    const taskQueueChannel = supabase
      .channel('hub:task_queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_queue' }, () => {
        debouncedRefreshTaskQueue()
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') onConnected()
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED')
          onDisconnected()
      })

    const memoryChannel = supabase
      .channel('hub:memory_documents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memory_documents' }, () => {
        void fetchQuote()
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') onConnected()
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED')
          onDisconnected()
      })

    /* ---------- polling fallback ---------- */
    pollInterval.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshAll()
      }
    }, POLL_INTERVAL_MS)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refreshAll()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      mounted = false
      if (disconnectTimer.current) clearTimeout(disconnectTimer.current)
      if (pollInterval.current) clearInterval(pollInterval.current)
      document.removeEventListener('visibilitychange', onVisibility)
      void supabase.removeChannel(taskChannel)
      void supabase.removeChannel(approvalChannel)
      void supabase.removeChannel(auditChannel)
      void supabase.removeChannel(agentChannel)
      void supabase.removeChannel(taskQueueChannel)
      void supabase.removeChannel(memoryChannel)
    }
  }, [
    refreshAll,
    fetchQuote,
    debouncedRefreshTasks,
    debouncedRefreshAuditLog,
    debouncedRefreshAgents,
    debouncedRefreshApproval,
    debouncedRefreshTaskQueue,
  ])

  const value: HubRealtimeState = {
    tasks,
    approvalQueue,
    auditLog,
    agents,
    taskQueueDepth,
    quote,
    syncMode,
    isLoading,
    errors,
    refreshTasks: fetchTasks,
    refreshApprovalQueue: fetchApprovalQueue,
    refreshAuditLog: fetchAuditLog,
    refreshAgents: fetchAgents,
    refreshAll,
  }

  return (
    <HubRealtimeContext.Provider value={value}>
      {children}
    </HubRealtimeContext.Provider>
  )
}
