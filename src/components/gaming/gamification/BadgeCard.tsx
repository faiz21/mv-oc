import { Award, Star, Trophy, Zap } from 'lucide-react'
import type { Tables } from '@/types'

type Badge = Tables<'badges'>
type BadgeEarned = Tables<'badges_earned'>

const TIER_COLORS: Record<string, string> = {
  common: 'rgba(192,192,192,0.15)',
  rare: 'rgba(205,127,50,0.15)',
  epic: 'rgba(255,193,116,0.15)',   // not in DB but keep for forward compat
  legendary: 'rgba(180,199,220,0.15)',
  gold: 'rgba(255,193,116,0.15)',
  silver: 'rgba(192,192,192,0.15)',
  bronze: 'rgba(205,127,50,0.15)',
  platinum: 'rgba(180,199,220,0.15)',
}

const TIER_TEXT: Record<string, string> = {
  common: '#C0C0C0',
  rare: '#CD7F32',
  epic: 'var(--primary)',
  legendary: '#B4C7DC',
  gold: 'var(--primary)',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  platinum: '#B4C7DC',
}

function iconFromUrl(url: string | null) {
  if (!url) return 'award'
  if (url.includes('trophy')) return 'trophy'
  if (url.includes('star')) return 'star'
  if (url.includes('zap')) return 'zap'
  return 'award'
}

interface BadgeCardProps {
  badge: Badge
  earned?: BadgeEarned
  rarityCount?: number
  locked?: boolean
}

export function BadgeCard({ badge, earned, rarityCount, locked }: BadgeCardProps) {
  const tier = badge.rarity
  const icon = iconFromUrl(badge.icon_url)

  return (
    <div
      className={`rounded-2xl p-4 transition-all ${locked ? 'opacity-40 grayscale' : ''}`}
      style={{
        background: locked ? 'var(--surface-container-low)' : TIER_COLORS[tier] || 'var(--surface-container)',
        border: `1px solid ${locked ? 'transparent' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: locked ? 'var(--surface-container)' : TIER_COLORS[tier], color: TIER_TEXT[tier] }}
        >
          {icon === 'trophy' ? <Trophy size={20} /> :
           icon === 'star' ? <Star size={20} /> :
           icon === 'zap' ? <Zap size={20} /> :
           <Award size={20} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--on-surface)' }}>
              {badge.name}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"
              style={{ background: 'rgba(255,255,255,0.05)', color: TIER_TEXT[tier] }}
            >
              {tier}
            </span>
          </div>
          <div className="mt-0.5 text-[12px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
            {badge.description}
          </div>
          {earned && (
            <div className="mt-1.5 text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
              Earned {new Date(earned.awarded_at).toLocaleDateString()}
            </div>
          )}
          {rarityCount !== undefined && (
            <div className="mt-1 text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
              Earned by {rarityCount} members
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
