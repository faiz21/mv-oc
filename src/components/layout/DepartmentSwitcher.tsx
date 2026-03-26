'use client'

import { useDepartment } from '@/components/providers/department-provider'
import { ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function DepartmentSwitcher() {
  const { departments, activeDepartment, setActiveDepartment } = useDepartment()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (departments.length <= 1) {
    return (
      <div className="px-3 py-1.5 text-xs font-medium" style={{ color: 'var(--on-surface-variant)' }}>
        {activeDepartment?.name ?? 'No department'}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--surface-container)]"
        style={{ color: 'var(--on-surface-variant)' }}
      >
        <span className="truncate">{activeDepartment?.name ?? 'Select department'}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border py-1 shadow-lg"
          style={{
            background: 'var(--surface-container)',
            borderColor: 'var(--outline-variant)',
          }}
        >
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => {
                setActiveDepartment(dept)
                setOpen(false)
              }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-[var(--surface-container-high)] ${
                dept.id === activeDepartment?.id ? 'font-semibold' : ''
              }`}
              style={{ color: 'var(--on-surface)' }}
            >
              <span className="truncate">{dept.name}</span>
              <span className="ml-auto text-[10px] opacity-60">{dept.role}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
