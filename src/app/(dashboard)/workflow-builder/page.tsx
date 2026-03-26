import { requireAuthUser } from '@/lib/data/auth'
import { createClient } from '@/lib/supabase/server'
import { getWorkflows } from '@/lib/data/workflows'
import { WorkflowLibrary } from '@/components/workflows/WorkflowLibrary'

export default async function WorkflowBuilderPage() {
  await requireAuthUser()
  const supabase = await createClient()
  const workflows = await getWorkflows(supabase)

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <WorkflowLibrary workflows={workflows} />
    </div>
  )
}
