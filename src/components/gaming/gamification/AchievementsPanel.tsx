import { createClient } from '@/lib/supabase/server'
import { BadgeCard } from './BadgeCard'
import type { Tables } from '@/types'

type Badge = Tables<'badges'>
type BadgeEarned = Tables<'badges_earned'>

interface AchievementsPanelProps {
  userId: string
}

export async function AchievementsPanel({ userId }: AchievementsPanelProps) {
  const supabase = await createClient()

  const [{ data: allBadges }, { data: userBadges }] = await Promise.all([
    supabase.from('badges').select('*').order('rarity'),
    supabase.from('badges_earned').select('*, badge:badges(*)').eq('user_id', userId).eq('is_active', true).order('awarded_at', { ascending: false }),
  ])

  const earnedBadgeIds = new Set((userBadges || []).map(ub => ub.badge_id))
  const earnedBadges = userBadges || []
  const unearned = (allBadges || []).filter((b: Badge) => !earnedBadgeIds.has(b.id))

  // Count per-badge rarity for earned badges
  const badgeEarnedCounts: Record<string, number> = {}
  for (const badge of allBadges || []) {
    const { count } = await supabase
      .from('badges_earned')
      .select('id', { count: 'exact' })
      .eq('badge_id', badge.id)
      .eq('is_active', true)
    badgeEarnedCounts[badge.id] = count ?? 0
  }

  return (
    <div className="space-y-8">
      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div>
          <div className="mb-3 text-[12px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
            Earned ({earnedBadges.length})
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {earnedBadges.map(ub => {
              const badge = ub.badge as unknown as Badge | null
              if (!badge) return null
              return (
                <BadgeCard
                  key={ub.id}
                  badge={badge}
                  earned={ub as BadgeEarned}
                  rarityCount={badgeEarnedCounts[badge.id]}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Locked badges */}
      {unearned.length > 0 && (
        <div>
          <div className="mb-3 text-[12px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
            Locked ({unearned.length})
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {unearned.map((badge: Badge) => (
              <BadgeCard key={badge.id} badge={badge} locked />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {earnedBadges.length === 0 && (
        <div
          className="rounded-2xl p-8 text-center text-[14px]"
          style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}
        >
          Keep working! Your first badge is within reach.
        </div>
      )}
    </div>
  )
}
