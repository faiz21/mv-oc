import { cookies } from 'next/headers'
import { requireAuthUser } from '@/lib/data/auth'
import { createClient } from '@/lib/supabase/server'
import { getActionQueue, getApprovalQueue } from '@/lib/data/tasks'
import { buildApprovalQueue } from '@/features/approvals/approval-queue'
import { MissionControlView } from '@/components/mission-control/MissionControlView'
import type { ApprovalQueueRecord } from '@/features/approvals/approval-queue'

export default async function MissionControlPage() {
  const user = await requireAuthUser()
  const supabase = await createClient()

  const cookieStore = await cookies()
  const activeDeptId =
    cookieStore.get('mv-active-dept')?.value ??
    user.departmentMemberships[0]?.department_id ??
    ''

  const [actionQueue, approvalRows] = await Promise.all([
    getActionQueue(supabase, activeDeptId),
    getApprovalQueue(supabase, user.id),
  ])

  // Map database rows to the shape buildApprovalQueue expects
  const approvalRecords: ApprovalQueueRecord[] = approvalRows.map((row) => ({
    id: row.id,
    gateType: row.gate_type as ApprovalQueueRecord['gateType'],
    status: row.status as ApprovalQueueRecord['status'],
    sourceRef: row.source_ref,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    content: row.content as Record<string, unknown> | null,
  }))

  const { sections, counts } = buildApprovalQueue(approvalRecords)

  return (
    <MissionControlView
      actionQueue={actionQueue}
      approvalSections={sections}
      approvalCounts={counts}
    />
  )
}
