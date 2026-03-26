/**
 * POST /api/gaming/backfill
 *
 * Triggers the points-backfill Edge Function for the authenticated user.
 * Called after a user opts in to gamification (T-08-08).
 * Fire-and-forget: returns 202 immediately; backfill runs async.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Trigger backfill async — do not await, return immediately
  supabase.functions.invoke('points-backfill', {
    body: { user_id: user.id },
  }).catch((err: unknown) => {
    console.error('backfill invoke error:', err)
  })

  return NextResponse.json({ success: true, message: 'Backfill started' }, { status: 202 })
}
