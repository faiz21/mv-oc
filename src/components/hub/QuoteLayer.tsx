'use client'

import { Quote } from 'lucide-react'
import { useHubRealtime } from '@/features/hub/contexts/HubRealtimeContext'

export function QuoteLayer() {
  const { quote } = useHubRealtime()

  if (!quote) return null

  return (
    <div
      className="rounded-2xl px-6 py-6"
      style={{ background: 'rgba(17,19,23,0.5)' }}
    >
      <div className="flex items-start gap-4">
        <Quote
          size={20}
          className="mt-0.5 flex-shrink-0 rotate-180"
          style={{ color: 'var(--primary)', opacity: 0.6 }}
        />
        <div>
          <p
            className="text-[15px] leading-relaxed font-medium italic"
            style={{ color: 'var(--on-surface)' }}
          >
            {quote.quote}
          </p>
          <p
            className="mt-2 text-[12px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            — {quote.author}
          </p>
        </div>
      </div>
    </div>
  )
}
