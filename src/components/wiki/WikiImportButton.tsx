'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'

export function WikiImportButton() {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'running' | 'complete' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function handleImport() {
    setState('running')
    setMessage('Importing markdown files into the Wiki…')

    const response = await fetch('/api/wiki/import', { method: 'POST' })
    const payload = await response.json()

    if (!response.ok) {
      setState('error')
      setMessage(payload.error ?? 'Import failed.')
      return
    }

    setState('complete')
    setMessage(`Imported ${payload.importedCount} article(s).`)
    startTransition(() => router.refresh())
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={() => void handleImport()} disabled={state === 'running'} className="inline-flex rounded-full px-5 py-3 text-sm font-semibold" style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)' }}>
        Import Markdown
      </button>
      {message ? (
        <span className="text-sm" style={{ color: 'var(--secondary)' }}>
          {message}
        </span>
      ) : null}
    </div>
  )
}
