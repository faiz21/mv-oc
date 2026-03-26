import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SandboxHub } from '@/components/gaming/sandbox/SandboxHub'

export default async function GamingSessionSandboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load active/draft workflows for the selector
  const { data: workflows } = await supabase
    .from('workflows')
    .select('id, name, status')
    .in('status', ['active', 'draft'])
    .order('name')

  const workflowList = (workflows || []).map(w => ({ id: w.id, name: w.name }))

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-[28px] font-bold tracking-tight" style={{ color: 'var(--on-surface)' }}>
            Sandbox
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: 'var(--on-surface-variant)' }}>
            Run workflows with mock data. Zero production impact. Learn by doing.
          </p>
        </div>

        <SandboxHub userId={user.id} workflows={workflowList} />
      </div>
    </div>
  )
}
