import type { InterventionPriority, InterventionStatus } from '@/types/entities'
import type { CalendarEvent } from '@/modules/calendar/types/calendar-module.types'

/** Couleurs dynamiques statut + priorité (design premium SAV) */
export function getEventColorClasses(event: Pick<CalendarEvent, 'status' | 'priority' | 'isOverdue' | 'isUrgent'>): string {
  if (event.isOverdue && event.status !== 'completed' && event.status !== 'returned') {
    return 'border-danger/40 bg-danger/15 text-danger ring-danger/25'
  }

  if (event.isUrgent || event.priority === 'urgent') {
    return 'border-danger/35 bg-danger/10 text-danger ring-danger/20'
  }

  switch (event.status) {
    case 'diagnostic':
      return 'border-neon-blue/35 bg-primary-muted/80 text-neon-blue ring-neon-blue/20'
    case 'in_progress':
      return 'border-warning/35 bg-warning/10 text-warning ring-warning/20'
    case 'waiting_parts':
      return 'border-text-muted/30 bg-surface-hover/60 text-text-secondary ring-border/40'
    case 'completed':
      return 'border-neon-green/35 bg-accent-muted/60 text-neon-green ring-neon-green/20'
    case 'returned':
      return 'border-neon-green/25 bg-accent-muted/40 text-neon-green/80 ring-neon-green/15'
    default:
      return 'border-border bg-surface-hover/50 text-text-primary ring-border/30'
  }
}

export function getPriorityDotClass(priority: InterventionPriority): string {
  switch (priority) {
    case 'urgent':
      return 'bg-danger glow-red'
    case 'high':
      return 'bg-warning'
    case 'low':
      return 'bg-text-muted'
    default:
      return 'bg-neon-blue'
  }
}

export function getStatusLegend(): Array<{ status: InterventionStatus; label: string; className: string }> {
  return [
    { status: 'diagnostic', label: 'Diagnostic', className: 'bg-neon-blue/20 border-neon-blue/30' },
    { status: 'in_progress', label: 'En cours', className: 'bg-warning/15 border-warning/30' },
    { status: 'waiting_parts', label: 'Attente pièce', className: 'bg-surface-hover border-border' },
    { status: 'completed', label: 'Terminé', className: 'bg-neon-green/15 border-neon-green/30' },
    { status: 'returned', label: 'Restitué', className: 'bg-neon-green/10 border-neon-green/20' },
  ]
}
