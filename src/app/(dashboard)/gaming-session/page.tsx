import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LeaderboardPanel } from '@/components/gaming/gamification/LeaderboardPanel'
import { AchievementsPanel } from '@/components/gaming/gamification/AchievementsPanel'
import { PointsLog } from '@/components/gaming/gamification/PointsLog'
import { GamificationOptInBanner } from '@/components/gaming/gamification/GamificationOptInBanner'
import { BadgeNotificationToast } from '@/components/gaming/gamification/BadgeNotificationToast'

type Tab = 'leaderboard' | 'my-points' | 'achievements'

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function GamingSessionPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, gamification_enabled')
    .eq('id', user.id)
    .single()

  const gamificationEnabled = profile?.gamification_enabled ?? false

  // Total points for current user
  let totalPoints = 0
  if (gamificationEnabled) {
    const { data: pointRows } = await supabase
      .from('points_log')
      .select('points')
      .eq('user_id', user.id)
    totalPoints = pointRows?.reduce((sum, r) => sum + r.points, 0) ?? 0
  }

  const sp = await searchParams
  const tab = (sp.tab as Tab) || 'leaderboard'

  const tabs: { key: Tab; label: string }[] = [
    { key: 'leaderboard', label: 'Leaderboard' },
    { key: 'my-points', label: 'My Points' },
    { key: 'achievements', label: 'Achievements' },
  ]

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-[28px] font-bold tracking-tight" style={{ color: 'var(--on-surface)' }}>
            Gaming Session
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: 'var(--on-surface-variant)' }}>
            Earn points for your work. Climb the leaderboard. Celebrate achievements.
          </p>
        </div>

        {/* Opt-in banner (shown to users who haven't opted in) */}
        {!gamificationEnabled && <GamificationOptInBanner />}

        {/* Tab nav */}
        <div className="mb-6 flex gap-1 rounded-2xl p-1" style={{ background: 'var(--surface-container-low)' }}>
          {tabs.map(t => (
            <a
              key={t.key}
              href={`/gaming-session?tab=${t.key}`}
              className="flex-1 rounded-xl px-4 py-2.5 text-center text-[13px] font-medium transition-colors"
              style={{
                background: tab === t.key ? 'var(--surface-container)' : 'transparent',
                color: tab === t.key ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                textDecoration: 'none',
              }}
            >
              {t.label}
            </a>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'leaderboard' && (
          <LeaderboardPanel
            currentUserId={user.id}
            initialSnapshot={null}
          />
        )}

        {tab === 'my-points' && (
          <PointsLog
            userId={user.id}
            totalPoints={totalPoints}
          />
        )}

        {tab === 'achievements' && (
          <AchievementsPanel userId={user.id} />
        )}
      </div>

      {/* Badge notification toast — listens via Realtime */}
      {gamificationEnabled && <BadgeNotificationToast userId={user.id} />}
    </div>
  )
}
