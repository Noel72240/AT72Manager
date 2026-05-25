import type { Intervention, InterventionPriority, InterventionStatus } from '@/types/entities/intervention.types'
import type { BadgeVariant } from '@/theme/variants'

export const STATUS_LABELS: Record<InterventionStatus, string> = {
  diagnostic: 'Diagnostic',
  in_progress: 'En cours',
  waiting_parts: 'Attente pièce',
  completed: 'Terminé',
  returned: 'Restitué',
}

export const STATUS_VARIANTS: Record<InterventionStatus, BadgeVariant> = {
  diagnostic: 'primary',
  in_progress: 'warning',
  waiting_parts: 'default',
  completed: 'success',
  returned: 'primary',
}

export const ALL_STATUSES: InterventionStatus[] = [
  'diagnostic',
  'in_progress',
  'waiting_parts',
  'completed',
  'returned',
]

export const PRIORITY_LABELS: Record<InterventionPriority, string> = {
  low: 'Basse',
  medium: 'Normale',
  high: 'Haute',
  urgent: 'Urgente',
}

export const ALL_PRIORITIES: InterventionPriority[] = ['low', 'medium', 'high', 'urgent']

export function normalizeInterventionPriority(value: string | null | undefined): InterventionPriority {
  const map: Record<string, InterventionPriority> = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    urgent: 'urgent',
  }
  return map[value ?? 'medium'] ?? 'medium'
}

export function normalizeInterventionStatus(value: string): InterventionStatus {
  const map: Record<string, InterventionStatus> = {
    diagnostic: 'diagnostic',
    in_progress: 'in_progress',
    waiting_parts: 'waiting_parts',
    completed: 'completed',
    returned: 'returned',
    scheduled: 'diagnostic',
    cancelled: 'returned',
  }
  return map[value] ?? 'diagnostic'
}

export function getDeviceSummary(intervention: Pick<Intervention, 'deviceLabel' | 'brand' | 'model'>) {
  const parts = [intervention.deviceLabel, intervention.brand, intervention.model].filter(Boolean)
  return parts.join(' · ') || '—'
}
