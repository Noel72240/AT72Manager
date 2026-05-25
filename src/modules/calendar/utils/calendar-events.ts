import type { Client, Intervention } from '@/types/entities'
import { getClientFullName } from '@/modules/clients/utils/client-name'
import { getDeviceSummary, normalizeInterventionPriority } from '@/modules/interventions/utils/intervention-labels'
import type { CalendarEvent } from '@/modules/calendar/types/calendar-module.types'
import { addMinutes, endOfDay, startOfDay } from '@/modules/calendar/utils/calendar-dates'

const DEFAULT_DURATION = 60
const ACTIVE_STATUSES = new Set(['diagnostic', 'in_progress', 'waiting_parts'])

export function getInterventionDuration(intervention: Intervention): number {
  return intervention.durationMinutes && intervention.durationMinutes > 0
    ? intervention.durationMinutes
    : DEFAULT_DURATION
}

export function interventionToCalendarEvent(
  intervention: Intervention,
  clientMap: Map<string, Client>,
): CalendarEvent | null {
  if (!intervention.scheduledAt) return null

  const start = new Date(intervention.scheduledAt)
  if (Number.isNaN(start.getTime())) return null

  const durationMinutes = getInterventionDuration(intervention)
  const end = addMinutes(start, durationMinutes)
  const priority = normalizeInterventionPriority(intervention.priority)
  const client = clientMap.get(intervention.clientId)
  const now = Date.now()
  const isOverdue =
    ACTIVE_STATUSES.has(intervention.status) && start.getTime() < now - 15 * 60_000
  const isUrgent = priority === 'urgent' || priority === 'high'

  return {
    id: intervention.id,
    interventionId: intervention.id,
    title: intervention.reportedIssue,
    clientName: client ? getClientFullName(client) : 'Client inconnu',
    deviceSummary: getDeviceSummary(intervention),
    start,
    end,
    status: intervention.status,
    priority,
    scheduledAt: intervention.scheduledAt,
    durationMinutes,
    isOverdue,
    isUrgent,
  }
}

export function mapInterventionsToEvents(
  interventions: Intervention[],
  clients: Client[],
): CalendarEvent[] {
  const clientMap = new Map(clients.map((c) => [c.id, c]))
  return interventions
    .map((item) => interventionToCalendarEvent(item, clientMap))
    .filter((event): event is CalendarEvent => event !== null)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
}

export function filterEventsInRange(events: CalendarEvent[], start: Date, end: Date): CalendarEvent[] {
  return events.filter((event) => event.end >= start && event.start <= end)
}

export function getTodayEvents(events: CalendarEvent[]): CalendarEvent[] {
  const start = startOfDay(new Date())
  const end = endOfDay(new Date())
  return filterEventsInRange(events, start, end)
}

export function getUpcomingEvents(events: CalendarEvent[], days = 7): CalendarEvent[] {
  const now = new Date()
  const end = endOfDay(addDaysLocal(now, days))
  return events.filter(
    (event) =>
      event.start >= now &&
      event.status !== 'completed' &&
      event.status !== 'returned' &&
      event.start <= end,
  )
}

export function getUrgentEvents(events: CalendarEvent[]): CalendarEvent[] {
  return events.filter(
    (event) =>
      (event.isUrgent || event.isOverdue) &&
      event.status !== 'completed' &&
      event.status !== 'returned',
  )
}

function addDaysLocal(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function eventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const start = startOfDay(day)
  const end = endOfDay(day)
  return filterEventsInRange(events, start, end)
}

export const CALENDAR_DRAG_MIME = 'application/at72-calendar-event'
