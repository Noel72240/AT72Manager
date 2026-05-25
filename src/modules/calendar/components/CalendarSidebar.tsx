import { AlertTriangle, CalendarClock, Clock3 } from 'lucide-react'
import type { CalendarEvent } from '@/modules/calendar/types/calendar-module.types'
import { formatTime } from '@/modules/calendar/utils/calendar-dates'
import { getStatusLegend } from '@/modules/calendar/utils/calendar-colors'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { STATUS_LABELS } from '@/modules/interventions/utils/intervention-labels'
import { cn } from '@/utils/cn'

type CalendarSidebarProps = {
  todayEvents: CalendarEvent[]
  urgentEvents: CalendarEvent[]
  upcomingEvents: CalendarEvent[]
  onSelectEvent: (event: CalendarEvent) => void
}

function EventList({
  items,
  emptyLabel,
  onSelect,
}: {
  items: CalendarEvent[]
  emptyLabel: string
  onSelect: (event: CalendarEvent) => void
}) {
  if (items.length === 0) {
    return <p className="py-3 text-xs text-text-muted">{emptyLabel}</p>
  }

  return (
    <ul className="space-y-2">
      {items.slice(0, 8).map((event) => (
        <li key={event.id}>
          <button
            type="button"
            onClick={() => onSelect(event)}
            className="w-full rounded-lg border border-border/60 bg-surface-hover/20 px-3 py-2 text-left transition-colors hover:border-neon-blue/25 hover:bg-primary-muted/20"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-medium text-text-primary">{event.clientName}</span>
              <span className="shrink-0 text-[10px] text-text-muted">{formatTime(event.start)}</span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-text-secondary">{event.title}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="default" className="text-[10px]">
                {STATUS_LABELS[event.status]}
              </Badge>
              {event.isOverdue ? (
                <span className="text-[10px] font-medium text-danger">En retard</span>
              ) : null}
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function CalendarSidebar({
  todayEvents,
  urgentEvents,
  upcomingEvents,
  onSelectEvent,
}: CalendarSidebarProps) {
  const legend = getStatusLegend()

  return (
    <aside className="space-y-4">
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Clock3 className="size-4 text-neon-blue" />
          <h3 className="text-sm font-semibold text-text-primary">Interventions du jour</h3>
          <Badge variant="primary">{todayEvents.length}</Badge>
        </div>
        <EventList items={todayEvents} emptyLabel="Aucune intervention planifiée aujourd'hui." onSelect={onSelectEvent} />
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="size-4 text-danger" />
          <h3 className="text-sm font-semibold text-text-primary">Urgences</h3>
          <Badge variant="danger">{urgentEvents.length}</Badge>
        </div>
        <EventList items={urgentEvents} emptyLabel="Aucune urgence en cours." onSelect={onSelectEvent} />
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <CalendarClock className="size-4 text-neon-green" />
          <h3 className="text-sm font-semibold text-text-primary">À venir (7 j)</h3>
          <Badge>{upcomingEvents.length}</Badge>
        </div>
        <EventList items={upcomingEvents} emptyLabel="Aucun rendez-vous à venir." onSelect={onSelectEvent} />
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Légende statuts</h3>
        <ul className="space-y-2">
          {legend.map((item) => (
            <li key={item.status} className="flex items-center gap-2 text-xs text-text-secondary">
              <span className={cn('size-3 rounded border', item.className)} />
              {item.label}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[10px] text-text-muted">
          Sync Google Calendar active — configurez dans Paramètres → Intégrations
        </p>
      </Card>
    </aside>
  )
}
