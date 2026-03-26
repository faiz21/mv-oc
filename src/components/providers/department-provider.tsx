'use client'

import { createContext, useContext, useState, useCallback } from 'react'

export interface DepartmentOption {
  id: string
  name: string
  slug: string
  role: string
}

export interface DepartmentContextValue {
  departments: DepartmentOption[]
  activeDepartment: DepartmentOption | null
  setActiveDepartment: (dept: DepartmentOption) => void
}

export const DepartmentContext = createContext<DepartmentContextValue | null>(null)

export function DepartmentProvider({
  departments,
  initialSlug,
  children,
}: {
  departments: DepartmentOption[]
  initialSlug?: string
  children: React.ReactNode
}) {
  const initial =
    departments.find((d) => d.slug === initialSlug) ?? departments[0] ?? null

  const [activeDepartment, setActive] = useState<DepartmentOption | null>(initial)

  const setActiveDepartment = useCallback(
    (dept: DepartmentOption) => {
      setActive(dept)
      document.cookie = `mv-active-dept=${dept.slug}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    },
    [],
  )

  return (
    <DepartmentContext.Provider
      value={{ departments, activeDepartment, setActiveDepartment }}
    >
      {children}
    </DepartmentContext.Provider>
  )
}

export function useDepartment(): DepartmentContextValue {
  const ctx = useContext(DepartmentContext)
  if (!ctx) throw new Error('useDepartment must be used within a DepartmentProvider')
  return ctx
}

export function useActiveDepartmentId(): string | null {
  const { activeDepartment } = useDepartment()
  return activeDepartment?.id ?? null
}
