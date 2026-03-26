import { cookies } from 'next/headers'
import { requireAuthUser } from '@/lib/data/auth'
import { createClient } from '@/lib/supabase/server'
import { getAgents } from '@/lib/data/agents'
import { getAuditLog } from '@/lib/data/audit'
import { getApprovalQueue } from '@/lib/data/tasks'
import { HubRealtimeProvider } from '@/features/hub/contexts/HubRealtimeContext'
import { HubOverviewConnected } from '@/components/hub/HubOverview'
import type { Tables } from '@/types'

export const dynamic = 'force-dynamic'

export default async function HubPage() {
  const [user, cookieStore, supabase] = await Promise.all([
    requireAuthUser(),
    cookies(),
    createClient(),
  ])

  const activeDeptId =
    cookieStore.get('mv-active-dept')?.value ??
    user.departmentMemberships[0]?.department_id ??
    ''

  // Parallel initial data fetches for SSR hydration
  const [approvalRows, agentRows, auditResult, taskRows] = await Promise.all([
    getApprovalQueue(supabase, user.id),
    activeDeptId ? getAgents(supabase) : Promise.resolve([] as Tables<'agents'>[]),
    getAuditLog(supabase, { limit: 50 }),
    activeDeptId
      ? supabase
          .from('tasks')
          .select('*')
          .eq('department_id', activeDeptId)
          .eq('assigned_to', user.id)
          .order('updated_at', { ascending: false })
          .limit(100)
          .then(({ data }) => data ?? [])
      : Promise.resolve([] as Tables<'tasks'>[]),
  ])

  // Count unreleased queue items as queue depth
  const queueDepthResult = await supabase
    .from('task_queue')
    .select('*', { count: 'exact', head: true })
    .is('released_at', null)
  const taskQueueDepth = queueDepthResult.count ?? 0

  // Fetch quote from memory_documents
  const quoteResult = await supabase
    .from('memory_documents')
    .select('*')
    .eq('scope', 'global')
    .eq('doc_type', 'daily_quote')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let initialQuote: { quote: string; author: string; date: string } | null = null
  if (quoteResult.data) {
    try {
      const parsed = JSON.parse(quoteResult.data.markdown_content) as {
        quote?: string
        author?: string
        date?: string
      }
      if (parsed.quote && parsed.author) {
        initialQuote = {
          quote: parsed.quote,
          author: parsed.author,
          date: parsed.date ?? new Date().toISOString().slice(0, 10),
        }
      }
    } catch {
      // Use fallback
    }
  }

  return (
    <HubRealtimeProvider
      initialTasks={taskRows}
      initialApprovalQueue={approvalRows}
      initialAuditLog={auditResult.entries}
      initialAgents={agentRows}
      initialTaskQueueDepth={taskQueueDepth}
      initialQuote={initialQuote}
      departmentId={activeDeptId || undefined}
      userId={user.id}
    >
      <HubOverviewConnected />
    </HubRealtimeProvider>
  )
}
