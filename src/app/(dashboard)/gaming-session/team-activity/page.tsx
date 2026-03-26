import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TeamActivityHub } from '@/components/gaming/team-activity/TeamActivityHub'
import type { Tables } from '@/types'

type TeamActivity = Tables<'team_activity'>

// Extended types with joined data
type ShoutoutWithAuthor = TeamActivity & { author?: { id?: string; full_name?: string | null } | null }
type PollWithResponses = TeamActivity & { responses?: Tables<'team_activity_responses'>[] }

export default async function GamingSessionTeamActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if user is admin (for calendar event creation)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  // Load recent shoutouts — select without join (author name fetched client-side if needed)
  const { data: rawShoutouts } = await supabase
    .from('team_activity')
    .select('*')
    .eq('type', 'shoutout')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(30)

  // Load active polls
  const { data: rawPolls } = await supabase
    .from('team_activity')
    .select('*, responses:team_activity_responses(*)')
    .eq('type', 'poll')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20)

  const shoutouts = (rawShoutouts || []) as ShoutoutWithAuthor[]
  const polls = (rawPolls || []) as PollWithResponses[]

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-[28px] font-bold tracking-tight" style={{ color: 'var(--on-surface)' }}>
            Team Activity
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: 'var(--on-surface-variant)' }}>
            Celebrate wins. Share polls. Stay connected with the team.
          </p>
        </div>

        <TeamActivityHub
          userId={user.id}
          shoutouts={shoutouts}
          polls={polls}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}
