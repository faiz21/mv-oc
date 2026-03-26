import { describe, expect, it } from 'vitest'
import {
  buildWikiApprovalContent,
  getNextWikiVersionNumber,
  validateReviewSubmission,
  validateWikiRejectionReason,
} from './wiki-workflow'

describe('wiki workflow helpers', () => {
  it('requires minimum article fields before review submission', () => {
    expect(
      validateReviewSubmission({
        title: '',
        category: 'security',
        content: 'short',
      }),
    ).toContain('Title is required.')

    expect(
      validateReviewSubmission({
        title: 'Security Best Practices',
        category: '',
        content: '# Heading\n\nThis draft has enough content to be reviewed safely by admins.',
      }),
    ).toContain('Category is required.')
  })

  it('requires a rejection reason and increments version numbers deterministically', () => {
    expect(validateWikiRejectionReason('')).toBe('Rejection reason is required.')
    expect(validateWikiRejectionReason('Missing security implications section')).toBeNull()
    expect(getNextWikiVersionNumber([])).toBe(1)
    expect(getNextWikiVersionNumber([1, 3, 2])).toBe(4)
  })

  it('builds approval content with change summary for review queue rendering', () => {
    expect(
      buildWikiApprovalContent({
        title: 'Security Best Practices',
        category: 'Standards/Security',
        changeSummary: 'Created per 2026 audit',
      }),
    ).toEqual({
      title: 'Security Best Practices',
      category: 'Standards/Security',
      description: 'Created per 2026 audit',
      status: 'review',
    })
  })
})
