import { googleCalendarAuthService } from '@/services/calendar/google/google-calendar-auth.service'
import type {
  GoogleCalendarEvent,
  GoogleCalendarEventPayload,
  GoogleCalendarListEntry,
} from '@/services/calendar/google/google-calendar.types'

const API_BASE = 'https://www.googleapis.com/calendar/v3'

async function googleFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await googleCalendarAuthService.ensureAccessToken()
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Google Calendar API (${response.status}): ${body.slice(0, 240)}`)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const googleCalendarApi = {
  async listCalendars(): Promise<GoogleCalendarListEntry[]> {
    const data = await googleFetch<{ items?: GoogleCalendarListEntry[] }>(
      '/users/me/calendarList?minAccessRole=writer',
    )
    return data.items ?? []
  },

  async createEvent(calendarId: string, event: GoogleCalendarEventPayload): Promise<GoogleCalendarEvent> {
    return googleFetch<GoogleCalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      { method: 'POST', body: JSON.stringify(event) },
    )
  },

  async updateEvent(
    calendarId: string,
    eventId: string,
    event: Partial<GoogleCalendarEventPayload>,
  ): Promise<GoogleCalendarEvent> {
    return googleFetch<GoogleCalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: 'PATCH', body: JSON.stringify(event) },
    )
  },

  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    await googleFetch<void>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: 'DELETE' },
    )
  },

  async getEvent(calendarId: string, eventId: string): Promise<GoogleCalendarEvent> {
    return googleFetch<GoogleCalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    )
  },

  async listUpdatedEvents(
    calendarId: string,
    updatedMin: string,
  ): Promise<GoogleCalendarEvent[]> {
    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      updatedMin,
      maxResults: '100',
    })

    const data = await googleFetch<{ items?: GoogleCalendarEvent[] }>(
      `/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    )
    return data.items ?? []
  },
}
