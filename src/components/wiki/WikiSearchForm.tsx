import { Search } from 'lucide-react'

interface WikiSearchFormProps {
  defaultValue?: string
  category?: string | null
  action?: string
  placeholder?: string
}

export function WikiSearchForm({
  defaultValue,
  category,
  action = '/wiki/search',
  placeholder = 'Search standards, SOPs, and guides',
}: WikiSearchFormProps) {
  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row">
      {category ? <input type="hidden" name="category" value={category} /> : null}
      <label className="flex min-h-11 flex-1 items-center gap-3 rounded-[22px] border px-4 py-3" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
        <Search size={16} style={{ color: 'var(--secondary)' }} />
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none"
          style={{ color: 'var(--on-surface)' }}
        />
      </label>
      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold"
        style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)' }}
      >
        Search
      </button>
    </form>
  )
}
