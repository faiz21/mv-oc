'use client'

import { useEffect, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { WikiCategoryNode } from '@/features/wiki/wiki-content'

const STORAGE_KEY = 'mv-wiki-selected-category'

interface WikiCategoryExplorerProps {
  categories: WikiCategoryNode[]
  initialCategory?: string | null
}

export function WikiCategoryExplorer({
  categories,
  initialCategory,
}: WikiCategoryExplorerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const options = useMemo(() => flattenCategories(categories), [categories])

  useEffect(() => {
    if (initialCategory) {
      window.localStorage.setItem(STORAGE_KEY, initialCategory)
      return
    }

    const savedCategory = window.localStorage.getItem(STORAGE_KEY)
    if (!savedCategory) return

    const params = new URLSearchParams(searchParams.toString())
    params.set('category', savedCategory)
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname)
  }, [initialCategory, pathname, router, searchParams])

  function updateCategory(nextCategory: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (nextCategory) {
      params.set('category', nextCategory)
      window.localStorage.setItem(STORAGE_KEY, nextCategory)
    } else {
      params.delete('category')
      window.localStorage.removeItem(STORAGE_KEY)
    }

    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname)
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[24px] border p-4 md:hidden" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
        <label className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--secondary)' }}>
            Category
          </span>
          <select
            value={initialCategory ?? ''}
            onChange={(event) => updateCategory(event.target.value)}
            className="min-h-11 rounded-2xl border px-4 py-3 text-sm outline-none"
            style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
          >
            <option value="">All Published</option>
            {options.map((option) => (
              <option key={option.path} value={option.path}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <nav
        aria-label="Wiki categories"
        className="hidden rounded-[24px] border p-4 md:block"
        style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}
      >
        <button
          type="button"
          onClick={() => updateCategory('')}
          className="mb-3 flex min-h-11 w-full items-center justify-between rounded-2xl px-3 text-left text-sm font-medium"
          style={{
            background: !initialCategory ? 'rgba(255,193,116,0.12)' : 'transparent',
            color: !initialCategory ? 'var(--primary)' : 'var(--on-surface)',
          }}
        >
          <span>All Published</span>
        </button>
        <div className="grid gap-1">
          {categories.map((category) => (
            <CategoryBranch
              key={category.path}
              category={category}
              activePath={initialCategory ?? ''}
              onSelect={updateCategory}
              depth={0}
            />
          ))}
        </div>
      </nav>
    </div>
  )
}

function CategoryBranch({
  category,
  activePath,
  depth,
  onSelect,
}: {
  category: WikiCategoryNode
  activePath: string
  depth: number
  onSelect: (path: string) => void
}) {
  const isActive = activePath === category.path
  const isExpanded = activePath === category.path || activePath.startsWith(`${category.path}/`)

  return (
    <div className="grid gap-1">
      <button
        type="button"
        onClick={() => onSelect(category.path)}
        className="flex min-h-11 items-center justify-between rounded-2xl px-3 text-left text-sm"
        style={{
          marginLeft: depth * 10,
          background: isActive ? 'rgba(255,193,116,0.12)' : 'transparent',
          color: isActive ? 'var(--primary)' : 'var(--on-surface)',
        }}
      >
        <span>{category.label}</span>
        <span className="text-xs" style={{ color: 'var(--secondary)' }}>
          {category.articleCount}
        </span>
      </button>
      {category.children.length > 0 && isExpanded
        ? category.children.map((child) => (
            <CategoryBranch
              key={child.path}
              category={child}
              activePath={activePath}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))
        : null}
    </div>
  )
}

function flattenCategories(categories: WikiCategoryNode[], prefix = ''): Array<{ path: string; label: string }> {
  return categories.flatMap((category) => {
    const label = prefix ? `${prefix} / ${category.label}` : category.label
    return [
      { path: category.path, label },
      ...flattenCategories(category.children, label),
    ]
  })
}
