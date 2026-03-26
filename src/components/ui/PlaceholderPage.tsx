interface PlaceholderPageProps {
  module: string
  page?: string
}

export function PlaceholderPage({ module, page }: PlaceholderPageProps) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-2">
      <p className="text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
        {module}
        {page ? ` — ${page}` : ''}
      </p>
    </div>
  )
}
