import type { CalendarEvent } from '@/modules/calendar/types/calendar-module.types'
import { getMonthGrid, isToday, startOfMonth } from '@/modules/calendar/utils/calendar-dates'
import { eventsForDay } from '@/modules/calendar/utils/calendar-events'
import { CalendarEventChip } from '@/modules/calendar/components/CalendarEventChip'
import { cn } from '@/utils/cn'

type MonthViewProps = {
  anchor: Date
  events: CalendarEvent[]
  onSelectEvent: (event: CalendarEvent) => void
  onSelectDay: (day: Date) => void
}

export function MonthView({ anchor, events, onSelectEvent, onSelectDay }: MonthViewProps) {
  const grid = getMonthGrid(anchor)
  const monthStart = startOfMonth(anchor)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-elevated/40">
      <div className="grid grid-cols-7 border-b border-border/60 bg-surface-hover/20 text-center text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((label) => (
          <div key={label} className="px-2 py-2">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {grid.map((day) => {
          const inMonth = day.getMonth() === monthStart.getMonth()
          const dayEvents = eventsForDay(events, day).slice(0, 3)
          const extra = eventsForDay(events, day).length - dayEvents.length

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                'min-h-[110px] border-b border-r border-border/40 p-1.5 text-left transition-colors hover:bg-primary-muted/10',
                !inMonth && 'bg-background/40 opacity-60',
                isToday(day) && 'bg-primary-muted/15 ring-1 ring-inset ring-neon-blue/20',
              )}
            >
              <span
                className={cn(
                  'inline-flex size-6 items-center justify-center rounded-md text-xs font-semibold',
                  isToday(day) ? 'bg-neon-blue text-background' : 'text-text-secondary',
                )}
              >
                {day.getDate()}
              </span>
              <div className="mt-1 space-y-1">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    role="presentation"
                  >
                    <CalendarEventChip
                      event={event}
                      compact
                      onClick={() => onSelectEvent(event)}
                    />
                  </div>
                ))}
                {extra > 0 ? <p className="px-1 text-[10px] text-text-muted">+{extra}</p> : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
