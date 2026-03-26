'use client'

import { createContext, useContext, type ReactNode } from 'react'

export interface AdminContextValue {
  userId: string
  isAdmin: boolean
  isDirector: boolean
  departmentIds: string[]
}

const AdminCtx = createContext<AdminContextValue | null>(null)

export function AdminProvider({
  value,
  children,
}: {
  value: AdminContextValue
  children: ReactNode
}) {
  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>
}

export function useAdminContext(): AdminContextValue {
  const ctx = useContext(AdminCtx)
  if (!ctx) throw new Error('useAdminContext must be used inside AdminProvider')
  return ctx
}
