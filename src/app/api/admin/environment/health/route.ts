import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/require-admin-api'
import { writeAudit } from '@/lib/admin/write-audit'
import { checkAllSecrets } from '@/lib/admin/secret-mask'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const result = await requireAdminApi()
  if (!result.ok) return result.response

  const checks = checkAllSecrets()

  const adminClient = createAdminClient()
  await writeAudit(adminClient, {
    actorId: result.auth.user.id,
    entityType: 'environment',
    entityId: 'health-check',
    event: 'environment:health_checked',
    data: {
      present: checks.filter((c) => c.present).length,
      missing: checks.filter((c) => !c.present).length,
    },
  })

  return NextResponse.json({ checks })
}
