'use client'

import { createContext, useContext } from 'react'
import type { CanonicalRole } from '@/lib/roles'

export interface UserContextValue {
  id: string
  email: string
  fullName: string | null
  role: CanonicalRole
  avatarUrl: string | null
}

export const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({
  user,
  children,
}: {
  user: UserContextValue
  children: React.ReactNode
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within a UserProvider')
  return ctx
}
