import type { CalendarSyncLink } from '@/services/calendar/google/google-calendar.types'

export type ConflictResolution = 'keep_at72' | 'keep_google'

export function detectSyncConflict(
  link: CalendarSyncLink,
  at72UpdatedAt: string,
  googleUpdatedAt?: string,
): boolean {
  if (!googleUpdatedAt || !link.lastSyncedAt) return false

  const at72Changed = new Date(at72UpdatedAt).getTime() > new Date(link.lastSyncedAt).getTime()
  const googleChanged =
    new Date(googleUpdatedAt).getTime() > new Date(link.lastSyncedAt).getTime()

  if (link.at72UpdatedAt && link.googleUpdatedAt) {
    const at72SinceLink =
      new Date(at72UpdatedAt).getTime() > new Date(link.at72UpdatedAt).getTime()
    const googleSinceLink =
      new Date(googleUpdatedAt).getTime() > new Date(link.googleUpdatedAt).getTime()
    return at72SinceLink && googleSinceLink
  }

  return at72Changed && googleChanged
}

export function markConflict(
  link: CalendarSyncLink,
  source: 'at72' | 'google',
): CalendarSyncLink {
  return {
    ...link,
    status: 'conflict',
    conflictSource: source,
  }
}
