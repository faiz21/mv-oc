import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/require-admin-api'
import { writeAudit } from '@/lib/admin/write-audit'
import { normalizeRole, type CanonicalRole } from '@/lib/roles'

export async function POST(request: Request) {
  const result = await requireAdminApi({ adminOnly: true })
  if (!result.ok) return result.response

  const body = (await request.json()) as {
    email?: string
    fullName?: string
    role?: CanonicalRole
  }

  if (!body.email || !body.email.includes('@')) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }

  const role = normalizeRole(body.role)
  const adminClient = createAdminClient()

  // Check for duplicate email
  const { data: existing } = await adminClient
    .from('profiles')
    .select('id')
    .eq('email', body.email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 })
  }

  // Create auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: body.email,
    email_confirm: true,
    user_metadata: { full_name: body.fullName ?? null, role },
    app_metadata: { role },
  })

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? 'Failed to create user.' },
      { status: 400 },
    )
  }

  // Create profile
  const { error: profileError } = await adminClient.from('profiles').insert({
    id: authData.user.id,
    email: body.email,
    full_name: body.fullName ?? null,
    role,
    status: 'active',
  })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  await writeAudit(adminClient, {
    actorId: result.auth.user.id,
    entityType: 'profile',
    entityId: authData.user.id,
    event: 'user:created',
    data: { email: body.email, role },
  })

  return NextResponse.json({ id: authData.user.id, email: body.email, role }, { status: 201 })
}
