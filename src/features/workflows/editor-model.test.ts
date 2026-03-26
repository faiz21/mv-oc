import {
  createDefaultWorkflowDocument,
  hydrateWorkflowDocument,
  serializeWorkflowDocument,
  validateWorkflowDocument,
} from '@/features/workflows/editor-model'

describe('workflow editor model', () => {
  it('fails validation when approval output is enabled without a reason', () => {
    const draft = createDefaultWorkflowDocument()
    draft.settings.requiresApproval = true
    draft.settings.requiresApprovalReason = ''
    draft.nodes[draft.nodes.length - 1].data.outputType = 'document'

    const result = validateWorkflowDocument(draft)

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Approval reason is required when requires approval is enabled.')
  })

  it('fails validation when document output does not enable workflow approval', () => {
    const draft = createDefaultWorkflowDocument()
    draft.settings.requiresApproval = false
    draft.nodes[draft.nodes.length - 1].data.outputType = 'document'

    const result = validateWorkflowDocument(draft)

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Approval-required outputs must enable requires approval.')
  })

  it('serializes and hydrates nodes and edges without losing workflow topology', () => {
    const draft = createDefaultWorkflowDocument({
      name: 'Client Intake',
      requiresApproval: true,
      requiresApprovalReason: 'Documents need review.',
    })
    draft.nodes[1].data.promptTemplate = 'Triage the inbound request.'

    const serialized = serializeWorkflowDocument(draft)
    const hydrated = hydrateWorkflowDocument({
      settings: draft.settings,
      nodes: serialized.nodes,
      edges: serialized.edges,
    })

    expect(hydrated.settings.name).toBe('Client Intake')
    expect(hydrated.nodes).toHaveLength(draft.nodes.length)
    expect(hydrated.edges.map((edge) => [edge.source, edge.target])).toEqual(
      draft.edges.map((edge) => [edge.source, edge.target]),
    )
    expect(hydrated.nodes[1].data.promptTemplate).toBe('Triage the inbound request.')
  })
})
