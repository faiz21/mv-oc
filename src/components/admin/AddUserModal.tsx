'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getAssignableRoles } from '@/features/admin/user-role-management'
import type { CanonicalRole } from '@/lib/roles'

interface AddUserModalProps {
  open: boolean
  onClose: () => void
}

export function AddUserModal({ open, onClose }: AddUserModalProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<CanonicalRole>('member')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName, role }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to create user.')
      return
    }

    setEmail('')
    setFullName('')
    setRole('member')
    onClose()
    startTransition(() => {
      router.refresh()
    })
  }

  const roles = getAssignableRoles()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="mx-4 w-full max-w-md rounded-2xl p-6"
        style={{
          background: 'var(--surface-container)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <h2 className="text-base font-semibold" style={{ color: 'var(--on-surface)' }}>
          Add User
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
              style={{
                background: 'var(--surface-container-low)',
                color: 'var(--on-surface)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
              style={{
                background: 'var(--surface-container-low)',
                color: 'var(--on-surface)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CanonicalRole)}
              className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
              style={{
                background: 'var(--surface-container-low)',
                color: 'var(--on-surface)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div
              className="rounded-xl px-4 py-3 text-[13px]"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-[13px] font-medium"
              style={{
                background: 'var(--surface-container-low)',
                color: 'var(--on-surface-variant)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl px-4 py-2 text-[13px] font-medium disabled:opacity-50"
              style={{
                background: 'var(--primary)',
                color: 'var(--on-primary)',
              }}
            >
              {isPending ? 'Creating...' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
