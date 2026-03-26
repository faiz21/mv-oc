const ERROR_MAP: Record<string, string> = {
  '23505': 'A record with this value already exists.',
  '23503': 'This record is referenced by other data and cannot be removed.',
  '42501': 'You do not have permission to perform this action.',
  PGRST116: 'The requested record was not found.',
  user_not_found: 'User not found.',
  duplicate_email: 'A user with this email already exists.',
  self_disable: 'You cannot disable your own account.',
  self_role_change: 'You cannot change your own role.',
}

/**
 * Convert a Supabase or API error to a user-friendly message.
 * Never exposes stack traces or internal details.
 */
export function toUserError(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: string }).code
    if (code && ERROR_MAP[code]) return ERROR_MAP[code]
    // Check if the message itself is a known code
    if (ERROR_MAP[error.message]) return ERROR_MAP[error.message]
  }

  if (typeof error === 'string') {
    if (ERROR_MAP[error]) return ERROR_MAP[error]
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code
    if (ERROR_MAP[code]) return ERROR_MAP[code]
  }

  return 'Something went wrong. Please try again.'
}
