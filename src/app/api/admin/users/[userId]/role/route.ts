import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canAccessAdminSurface, type CanonicalRole } from '@/lib/roles'
import { normalizePersistedRole, shouldBlockRoleChange } from '@/features/admin/user-role-management'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!canAccessAdminSurface(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await request.json()) as { role?: CanonicalRole }
  const nextRole = normalizePersistedRole(body.role)
  const adminClient = createAdminClient()

  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from('profiles')
    .select('id, role, email')
    .eq('id', userId)
    .single()

  if (targetProfileError || !targetProfile) {
    return NextResponse.json({ error: 'Target user not found.' }, { status: 404 })
  }

  const blockedReason = shouldBlockRoleChange({
    actorId: user.id,
    targetId: userId,
    currentRole: targetProfile.role,
    nextRole,
  })

  if (blockedReason) {
    return NextResponse.json({ errors: [blockedReason] }, { status: 400 })
  }

  const { error: profileUpdateError } = await adminClient
    .from('profiles')
    .update({ role: nextRole })
    .eq('id', userId)

  if (profileUpdateError) {
    return NextResponse.json({ errors: [profileUpdateError.message] }, { status: 400 })
  }

  const existingAuthUser = await adminClient.auth.admin.getUserById(userId)
  if (existingAuthUser.data.user) {
    await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...(existingAuthUser.data.user.user_metadata ?? {}),
        role: nextRole,
      },
      app_metadata: {
        ...(existingAuthUser.data.user.app_metadata ?? {}),
        role: nextRole,
      },
    })
  }

  await adminClient.from('audit_log').insert({
    entity_type: 'profile',
    entity_id: userId,
    actor_type: 'human',
    actor_ref: user.id,
    event: 'user:role_changed',
    data: {
      email: targetProfile.email,
      old_role: normalizePersistedRole(targetProfile.role),
      new_role: nextRole,
    },
  })

  return NextResponse.json({ success: true, role: nextRole })
}
