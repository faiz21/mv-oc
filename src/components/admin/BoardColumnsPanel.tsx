'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Save, GripVertical } from 'lucide-react'

interface BoardColumn {
  id: string
  name: string
  slug: string
  sort_order: number
  color: string | null
  is_done_state: boolean
  department_id: string
}

type DraftColumn = Omit<BoardColumn, 'id' | 'department_id'> & {
  id?: string
  _isNew?: boolean
}

interface BoardColumnsPanelProps {
  departmentId: string
}

export function BoardColumnsPanel({ departmentId }: BoardColumnsPanelProps) {
  const [columns, setColumns] = useState<DraftColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const basePath = `/api/admin/departments/${departmentId}/columns`

  const fetchColumns = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(basePath)
      if (!res.ok) throw new Error('Failed to load columns')
      const data: BoardColumn[] = await res.json()
      setColumns(data.map((c) => ({ ...c })))
    } catch {
      setError('Failed to load board columns.')
    } finally {
      setLoading(false)
    }
  }, [basePath])

  useEffect(() => {
    fetchColumns()
  }, [fetchColumns])

  function addColumn() {
    const maxOrder = columns.reduce((m, c) => Math.max(m, c.sort_order), 0)
    setColumns((prev) => [
      ...prev,
      {
        _isNew: true,
        name: '',
        slug: '',
        sort_order: maxOrder + 1,
        color: null,
        is_done_state: false,
      },
    ])
  }

  function updateField(index: number, field: keyof DraftColumn, value: unknown) {
    setColumns((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    )
  }

  function autoSlug(index: number, name: string) {
    const col = columns[index]
    // Only auto-slug for new columns or when slug is still auto-derived
    if (col._isNew || !col.slug) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      updateField(index, 'slug', slug)
    }
  }

  async function saveColumn(index: number) {
    const col = columns[index]
    if (!col.name || !col.slug) {
      setError('Name and slug are required.')
      return
    }

    const key = col.id ?? `new-${index}`
    setSavingId(key)
    setError(null)

    try {
      if (col._isNew) {
        const res = await fetch(basePath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: col.name,
            slug: col.slug,
            sort_order: col.sort_order,
            color: col.color,
            is_done_state: col.is_done_state,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error ?? 'Create failed')
        }
        const created: BoardColumn = await res.json()
        setColumns((prev) =>
          prev.map((c, i) =>
            i === index ? { ...created, _isNew: false } : c,
          ),
        )
      } else {
        const res = await fetch(basePath, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: col.id,
            name: col.name,
            slug: col.slug,
            sort_order: col.sort_order,
            color: col.color,
            is_done_state: col.is_done_state,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error ?? 'Update failed')
        }
      }
      setSavedId(key)
      setTimeout(() => setSavedId(null), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl py-12 text-[13px]"
        style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}
      >
        Loading columns...
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-[13px]"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        {columns.map((col, index) => {
          const key = col.id ?? `new-${index}`
          const isSaving = savingId === key
          const isSaved = savedId === key

          return (
            <div
              key={key}
              className="flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: 'var(--surface-container-low)' }}
            >
              <GripVertical
                size={14}
                className="shrink-0 opacity-30"
                style={{ color: 'var(--on-surface-variant)' }}
              />

              {/* Name */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={col.name}
                  placeholder="Column name"
                  onChange={(e) => {
                    updateField(index, 'name', e.target.value)
                    autoSlug(index, e.target.value)
                  }}
                  className="w-36 rounded-lg px-2 py-1.5 text-[13px] outline-none"
                  style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
                />
              </div>

              {/* Slug */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                  Slug
                </label>
                <input
                  type="text"
                  value={col.slug}
                  placeholder="slug"
                  onChange={(e) => updateField(index, 'slug', e.target.value)}
                  className="w-32 rounded-lg px-2 py-1.5 text-[13px] outline-none"
                  style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
                />
              </div>

              {/* Sort Order */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                  Order
                </label>
                <input
                  type="number"
                  min={0}
                  value={col.sort_order}
                  onChange={(e) =>
                    updateField(index, 'sort_order', parseInt(e.target.value) || 0)
                  }
                  className="w-16 rounded-lg px-2 py-1.5 text-center text-[13px] outline-none"
                  style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
                />
              </div>

              {/* Color */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                  Color
                </label>
                <input
                  type="text"
                  value={col.color ?? ''}
                  placeholder="#hex"
                  onChange={(e) =>
                    updateField(index, 'color', e.target.value || null)
                  }
                  className="w-20 rounded-lg px-2 py-1.5 text-[13px] outline-none"
                  style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
                />
              </div>

              {/* Done state toggle */}
              <div className="flex flex-col items-center gap-0.5">
                <label className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                  Done?
                </label>
                <button
                  type="button"
                  onClick={() => updateField(index, 'is_done_state', !col.is_done_state)}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors"
                  style={{
                    background: col.is_done_state
                      ? 'rgba(74,222,128,0.14)'
                      : 'var(--surface-container)',
                    color: col.is_done_state ? '#4ade80' : 'var(--on-surface-variant)',
                  }}
                >
                  {col.is_done_state ? 'Yes' : 'No'}
                </button>
              </div>

              {/* Save */}
              <div className="ml-auto flex items-end">
                <button
                  onClick={() => saveColumn(index)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] transition-colors disabled:opacity-50"
                  style={{
                    background: isSaved
                      ? 'rgba(74,222,128,0.1)'
                      : 'var(--surface-container)',
                    color: isSaved ? '#4ade80' : 'var(--on-surface)',
                  }}
                >
                  <Save size={12} />
                  {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={addColumn}
        className="mt-3 flex items-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-medium transition-colors"
        style={{
          background: 'var(--surface-container-low)',
          color: 'var(--on-surface-variant)',
        }}
      >
        <Plus size={14} />
        Add Column
      </button>
    </div>
  )
}
