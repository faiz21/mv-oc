import { notFound } from 'next/navigation'
import { requireAuthUser } from '@/lib/data/auth'
import { createClient } from '@/lib/supabase/server'
import { getWorkflowWithNodes } from '@/lib/data/workflows'
import { WorkflowCanvas } from '@/components/workflows/WorkflowCanvas'

interface Props {
  params: Promise<{ workflowId: string }>
}

export default async function WorkflowCanvasPage({ params }: Props) {
  await requireAuthUser()
  const { workflowId } = await params
  const supabase = await createClient()
  const data = await getWorkflowWithNodes(supabase, workflowId)

  if (!data) notFound()

  return (
    <div className="h-[calc(100vh-64px)]">
      <WorkflowCanvas
        document={data.document}
        versions={data.versions}
        agents={data.agents}
      />
    </div>
  )
}
