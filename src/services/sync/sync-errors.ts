import { formatSupabaseError } from '@/utils/format-supabase-error'

type PgError = {
  code?: string
  message?: string
  details?: string
}

function unwrap(error: unknown): PgError {
  if (error && typeof error === 'object') {
    const wrapped = error as { cause?: unknown; message?: string }
    if (wrapped.cause && typeof wrapped.cause === 'object') {
      return wrapped.cause as PgError
    }
    return error as PgError
  }
  return { message: String(error) }
}

export function getSyncErrorMessage(error: unknown): string {
  return formatSupabaseError(error)
}

export function isDuplicateKeyError(error: unknown): boolean {
  const pg = unwrap(error)
  const message = pg.message ?? ''
  return (
    pg.code === '23505' ||
    message.includes('duplicate key') ||
    message.includes('already exists')
  )
}

export function isNotFoundError(error: unknown): boolean {
  const pg = unwrap(error)
  const message = pg.message ?? ''
  return (
    pg.code === 'PGRST116' ||
    message.includes('0 rows') ||
    message.includes('not found') ||
    message.includes('Results contain 0 rows') ||
    message.includes('Cannot coerce the result to a single JSON object')
  )
}

export function isMissingSchemaError(error: unknown): boolean {
  const message = getSyncErrorMessage(error)
  return (
    message.includes('migration') ||
    message.includes('schema cache') ||
    message.includes('Could not find') ||
    message.includes('n\'a pas') ||
    message.includes('est absente')
  )
}
