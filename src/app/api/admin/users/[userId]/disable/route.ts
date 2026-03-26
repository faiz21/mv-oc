import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/require-admin-api'
import { writeAudit } from '@/lib/admin/write-audit'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const result = await requireAdminApi({ adminOnly: true })
  if (!result.ok) return result.response

  const { userId } = await params
  const body = (await request.json()) as { reason?: string }

  if (!body.reason?.trim()) {
    return NextResponse.json({ error: 'A reason is required.' }, { status: 400 })
  }

  // Prevent self-disable
  if (userId === result.auth.user.id) {
    return NextResponse.json({ error: 'You cannot disable your own account.' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, email, disabled_at')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }

  if (profile.disabled_at) {
    return NextResponse.json({ error: 'User is already disabled.' }, { status: 400 })
  }

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ disabled_at: new Date().toISOString(), status: 'disabled' })
    .eq('id', userId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  await writeAudit(adminClient, {
    actorId: result.auth.user.id,
    entityType: 'profile',
    entityId: userId,
    event: 'user:disabled',
    data: { email: profile.email, reason: body.reason },
  })

  return NextResponse.json({ success: true })
}
