'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useMemo, useState } from 'react'
import { getAssignableRoles, normalizePersistedRole, type AssignableRoleOption } from '@/features/admin/user-role-management'
import type { StoredRole } from '@/lib/roles'

interface UserRoleSelectProps {
  userId: string
  currentRole: StoredRole
}

export function UserRoleSelect({ userId, currentRole }: UserRoleSelectProps) {
  const router = useRouter()
  const options = useMemo<AssignableRoleOption[]>(() => getAssignableRoles(), [])
  const [nextRole, setNextRole] = useState(normalizePersistedRole(currentRole))
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function saveRole() {
    setIsSaving(true)
    setError(null)
    setNotice(null)

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      })

      const result = (await response.json()) as { error?: string; errors?: string[] }

      if (!response.ok) {
        setError(result.errors?.[0] ?? result.error ?? 'Unable to update role.')
        return
      }

      setNotice('Role updated.')
      startTransition(() => router.refresh())
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={nextRole}
          onChange={(event) => setNextRole(event.target.value as AssignableRoleOption['value'])}
          className="min-h-10 rounded-full px-4 text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)' }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={saveRole}
          disabled={isSaving || nextRole === normalizePersistedRole(currentRole)}
          className="inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-semibold"
          style={{
            background: isSaving || nextRole === normalizePersistedRole(currentRole) ? 'rgba(255,255,255,0.05)' : 'rgba(255,193,116,0.14)',
            color: isSaving || nextRole === normalizePersistedRole(currentRole) ? 'var(--on-surface-variant)' : 'var(--primary)',
          }}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
      {error ? <div className="text-xs" style={{ color: 'var(--status-failed)' }}>{error}</div> : null}
      {notice ? <div className="text-xs" style={{ color: 'var(--status-active)' }}>{notice}</div> : null}
    </div>
  )
}
