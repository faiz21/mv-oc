import { redirect } from 'next/navigation'
import { requireAuthUser } from '@/lib/data/auth'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdminSurface } from '@/lib/roles'
import { getAllFeedback } from '@/features/feedback-hub/feedback-data'
import { ChangelogFormPage } from '@/components/feedback-hub/ChangelogFormPage'

export default async function NewChangelogEntryPage() {
  const authUser = await requireAuthUser()
  if (!canAccessAdminSurface(authUser.role)) redirect('/dashboard/feedback-hub')

  const supabase = await createClient()
  // Pass existing feedback items so admin can link them
  const feedbackItems = await getAllFeedback(supabase)

  return (
    <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-8">
      <ChangelogFormPage feedbackItems={feedbackItems} />
    </div>
  )
}
