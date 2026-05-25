export type GoogleCalendarSyncStatus =
  | 'disconnected'
  | 'connected'
  | 'syncing'
  | 'error'
  | 'offline'

export type GoogleCalendarLinkStatus =
  | 'synced'
  | 'pending_push'
  | 'pending_pull'
  | 'conflict'
  | 'failed'

export type GoogleCalendarSettings = {
  enabled: boolean
  autoSync: boolean
  syncIntervalMinutes: number
  targetCalendarId: string
  targetCalendarName: string
  bidirectional: boolean
  /** Rappels natifs Google (minutes avant) */
  defaultReminderMinutes: number
  lastSyncAt?: string
  lastSyncError?: string
}

export const DEFAULT_GOOGLE_CALENDAR_SETTINGS: GoogleCalendarSettings = {
  enabled: false,
  autoSync: true,
  syncIntervalMinutes: 15,
  targetCalendarId: 'primary',
  targetCalendarName: 'Agenda principal',
  bidirectional: true,
  defaultReminderMinutes: 30,
}

export type GoogleOAuthTokens = {
  accessToken: string
  expiresAt: number
  scope?: string
  tokenType?: string
}

export type GoogleCalendarListEntry = {
  id: string
  summary: string
  primary?: boolean
  backgroundColor?: string
}

export type GoogleCalendarEventPayload = {
  summary: string
  description?: string
  location?: string
  start: { dateTime: string; timeZone?: string }
  end: { dateTime: string; timeZone?: string }
  colorId?: string
  reminders?: {
    useDefault: boolean
    overrides?: Array<{ method: 'popup' | 'email'; minutes: number }>
  }
  extendedProperties?: {
    private?: Record<string, string>
  }
}

export type GoogleCalendarEvent = GoogleCalendarEventPayload & {
  id: string
  etag?: string
  updated?: string
  status?: string
}

export type CalendarSyncLink = {
  interventionId: string
  googleEventId: string
  googleCalendarId: string
  etag?: string
  googleUpdatedAt?: string
  at72UpdatedAt?: string
  status: GoogleCalendarLinkStatus
  lastSyncedAt?: string
  lastError?: string
  conflictSource?: 'at72' | 'google'
}

export type GoogleCalendarQueueItem = {
  id: string
  interventionId: string
  action: 'create' | 'update' | 'delete'
  createdAt: string
  retryCount: number
  lastError?: string
}

export type GoogleCalendarSyncResult = {
  pushed: number
  pulled: number
  conflicts: number
  failed: number
  errors: string[]
}

export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
].join(' ')

export const META_GOOGLE_TOKENS = 'google_calendar_tokens'
export const META_GOOGLE_SETTINGS = 'google_calendar_settings'
export const META_GOOGLE_SYNC_TOKEN = 'google_calendar_sync_token'
