export function validateReviewSubmission(input: {
  title: string
  category: string
  content: string
}) {
  const errors: string[] = []

  if (!input.title.trim()) errors.push('Title is required.')
  if (!input.category.trim()) errors.push('Category is required.')
  if (!input.content.trim()) errors.push('Content is required.')
  if (input.content.trim().length < 60) {
    errors.push('Content must be at least 60 characters before review.')
  }

  return errors
}

export function validateWikiRejectionReason(reason: string) {
  return reason.trim() ? null : 'Rejection reason is required.'
}

export function getNextWikiVersionNumber(versionNumbers: number[]) {
  return Math.max(0, ...versionNumbers) + 1
}

export function buildWikiApprovalContent(input: {
  title: string
  category: string
  changeSummary?: string | null
}) {
  return {
    title: input.title,
    category: input.category,
    description: input.changeSummary?.trim() || null,
    status: 'review',
  }
}
