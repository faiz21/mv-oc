import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuditLog } from '@/lib/data/audit'
import { getRoleLabel } from '@/lib/roles'
import { UserActivityTab } from '@/components/admin/UserActivityTab'

interface Props {
  params: Promise<{ userId: string }>
}

export default async function UserDetailPage({ params }: Props) {
  const { userId } = await params
  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p style={{ color: 'var(--on-surface-variant)' }}>User not found.</p>
      </div>
    )
  }

  const { entries } = await getAuditLog(adminClient, {
    actorRef: userId,
    limit: 50,
  })

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link
        href="/admin/users"
        className="mb-4 inline-block text-[13px]"
        style={{ color: 'var(--primary)' }}
      >
        &larr; Back to Users
      </Link>

      <div className="mb-6">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--on-surface)' }}>
          {profile.full_name || profile.email}
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
          {profile.email} · {getRoleLabel(profile.role)} · {profile.status}
        </p>
      </div>

      <h2 className="mb-3 text-[14px] font-medium" style={{ color: 'var(--on-surface)' }}>
        Activity
      </h2>
      <UserActivityTab entries={entries} userName={profile.full_name} />
    </div>
  )
}
