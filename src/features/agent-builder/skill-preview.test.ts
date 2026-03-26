import { describe, expect, it } from 'vitest'
import { renderSkillMarkdown } from './skill-preview'

describe('skill preview', () => {
  it('renders a workspace-ready skill markdown preview', () => {
    const markdown = renderSkillMarkdown({
      name: 'Draft report',
      description: 'Create a structured draft report',
      dispatchMode: 'model_invocation',
      instructionMarkdown: 'Use approved inputs only.',
      inputSchema: { type: 'object', required: ['topic'] },
      outputSchema: { type: 'object', required: ['title'] },
      validationRules: ['requires_human_review'],
    })

    expect(markdown).toContain('name: Draft report')
    expect(markdown).toContain('## Dispatch Mode')
    expect(markdown).toContain('model_invocation')
    expect(markdown).toContain('requires_human_review')
  })
})
