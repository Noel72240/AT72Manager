import type { CalendarEvent } from '@/modules/calendar/types/calendar-module.types'
import { getWeekDays, isToday } from '@/modules/calendar/utils/calendar-dates'
import { eventsForDay } from '@/modules/calendar/utils/calendar-events'
import { CalendarEventChip } from '@/modules/calendar/components/CalendarEventChip'
import { cn } from '@/utils/cn'

type WeekViewProps = {
  anchor: Date
  events: CalendarEvent[]
  onSelectEvent: (event: CalendarEvent) => void
  onReschedule: (interventionId: string, scheduledAt: string, durationMinutes: number) => void
}

export function WeekView({ anchor, events, onSelectEvent, onReschedule }: WeekViewProps) {
  const days = getWeekDays(anchor)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-elevated/40">
      <div className="grid grid-cols-7 border-b border-border/60">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              'border-r border-border/40 px-2 py-2 text-center last:border-r-0',
              isToday(day) && 'bg-primary-muted/15',
            )}
          >
            <p className="text-[10px] uppercase text-text-muted">
              {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
            </p>
            <p className={cn('text-sm font-semibold', isToday(day) ? 'text-neon-blue' : 'text-text-primary')}>
              {day.getDate()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid max-h-[640px] grid-cols-7 overflow-y-auto">
        {days.map((day) => {
          const dayEvents = eventsForDay(events, day).slice(0, 6)
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[420px] space-y-1 border-r border-border/40 p-1.5 last:border-r-0',
                isToday(day) && 'bg-primary-muted/10',
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const raw = e.dataTransfer.getData('application/at72-calendar-event')
                if (!raw) return
                try {
                  const payload = JSON.parse(raw) as { interventionId: string; durationMinutes: number }
                  const slot = new Date(day)
                  slot.setHours(9, 0, 0, 0)
                  void onReschedule(payload.interventionId, slot.toISOString(), payload.durationMinutes)
                } catch {
                  // ignore
                }
              }}
            >
              {dayEvents.map((event) => (
                <CalendarEventChip
                  key={event.id}
                  event={event}
                  compact
                  draggable
                  onClick={() => onSelectEvent(event)}
                />
              ))}
              {eventsForDay(events, day).length > 6 ? (
                <p className="px-1 text-[10px] text-text-muted">
                  +{eventsForDay(events, day).length - 6} autres
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
