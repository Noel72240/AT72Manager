import type { InterventionPriority, InterventionStatus } from '@/types/entities'

export type CalendarViewMode = 'day' | 'week' | 'month'

export type CalendarEvent = {
  id: string
  interventionId: string
  title: string
  clientName: string
  deviceSummary: string
  start: Date
  end: Date
  status: InterventionStatus
  priority: InterventionPriority
  scheduledAt: string
  durationMinutes: number
  isOverdue: boolean
  isUrgent: boolean
}

export type ScheduleFormValues = {
  clientId: string
  reportedIssue: string
  scheduledAt: string
  durationMinutes: number
  priority: InterventionPriority
  status: InterventionStatus
  interventionId?: string
}

export type CalendarDragPayload = {
  interventionId: string
  durationMinutes: number
}
