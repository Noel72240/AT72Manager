import type { Client, Intervention } from '@/types/entities'
import type { GoogleCalendarEventPayload } from '@/services/calendar/google/google-calendar.types'
import { ROUTES } from '@/config/routes'

const PRIORITY_COLOR: Record<string, string> = {
  urgent: '11',
  high: '6',
  medium: '7',
  low: '8',
}

function getTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris'
}

function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString()
}

export function interventionToGoogleEvent(
  intervention: Intervention,
  client: Client | null,
  options: {
    technicianName?: string
    reminderMinutes?: number
    appBaseUrl?: string
  } = {},
): GoogleCalendarEventPayload {
  const start = intervention.scheduledAt!
  const duration = intervention.durationMinutes ?? 60
  const end = addMinutes(start, duration)
  const clientName = client
    ? `${client.firstName} ${client.lastName}`.trim()
    : 'Client AT72'

  const lines = [
    `Client : ${clientName}`,
    intervention.deviceLabel ? `Appareil : ${intervention.deviceLabel}` : null,
    intervention.brand || intervention.model
      ? `Marque / modèle : ${[intervention.brand, intervention.model].filter(Boolean).join(' ')}`
      : null,
    intervention.diagnostic ? `Diagnostic : ${intervention.diagnostic}` : null,
    options.technicianName ? `Technicien : ${options.technicianName}` : null,
    `Priorité : ${intervention.priority ?? 'medium'}`,
    `Statut : ${intervention.status}`,
    intervention.technicianNotes ? `Notes : ${intervention.technicianNotes}` : null,
    '',
    'Synchronisé depuis AT72Manager',
  ].filter(Boolean)

  return {
    summary: `${clientName} — ${intervention.reportedIssue.slice(0, 80)}`,
    description: lines.join('\n'),
    location: client?.address ?? undefined,
    start: { dateTime: start, timeZone: getTimeZone() },
    end: { dateTime: end, timeZone: getTimeZone() },
    colorId: PRIORITY_COLOR[intervention.priority ?? 'medium'],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: options.reminderMinutes ?? 30 },
        { method: 'email', minutes: options.reminderMinutes ?? 30 },
      ],
    },
    extendedProperties: {
      private: {
        at72_intervention_id: intervention.id,
        at72_priority: intervention.priority ?? 'medium',
        at72_status: intervention.status,
        at72_link: `${options.appBaseUrl ?? ''}#${ROUTES.INTERVENTIONS}`,
      },
    },
  }
}

export function googleEventToInterventionPatch(
  event: { start?: { dateTime?: string }; end?: { dateTime?: string }; description?: string },
): Partial<Pick<Intervention, 'scheduledAt' | 'durationMinutes' | 'technicianNotes'>> {
  const start = event.start?.dateTime
  if (!start) return {}

  let durationMinutes = 60
  const end = event.end?.dateTime
  if (end) {
    durationMinutes = Math.max(
      15,
      Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000),
    )
  }

  return {
    scheduledAt: start,
    durationMinutes,
    technicianNotes: event.description?.slice(0, 2000),
  }
}
