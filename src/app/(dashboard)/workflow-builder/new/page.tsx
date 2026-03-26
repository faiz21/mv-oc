'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AIDraftModal } from '@/components/workflows/AIDraftModal'
import { WorkflowEditor } from '@/components/workflows/WorkflowEditor'
import {
  createDefaultWorkflowDocument,
  type WorkflowEditorDocument,
} from '@/features/workflows/editor-model'

export default function WorkflowBuilderNewPage() {
  const router = useRouter()
  const [document, setDocument] = useState<WorkflowEditorDocument | null>(null)
  const [modalOpen, setModalOpen] = useState(true)

  function handleApply(doc: WorkflowEditorDocument) {
    setDocument(doc)
    setModalOpen(false)
  }

  function handleCloseModal() {
    // If user closes without choosing, provide default document
    if (!document) {
      setDocument(createDefaultWorkflowDocument())
    }
    setModalOpen(false)
  }

  // Show AI draft modal first
  if (modalOpen) {
    return (
      <AIDraftModal
        open={modalOpen}
        onClose={handleCloseModal}
        onApply={handleApply}
      />
    )
  }

  // Show editor with generated or default document
  const doc = document ?? createDefaultWorkflowDocument()

  return (
    <WorkflowEditor
      initialDocument={doc}
      versions={[]}
      agents={[]}
      isNew
    />
  )
}
