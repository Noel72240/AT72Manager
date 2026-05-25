import { useMemo } from 'react'
import type { CalendarEvent } from '@/modules/calendar/types/calendar-module.types'
import { eventsForDay } from '@/modules/calendar/utils/calendar-events'
import { isToday } from '@/modules/calendar/utils/calendar-dates'
import { CALENDAR_DRAG_MIME } from '@/modules/calendar/utils/calendar-events'
import {
  CALENDAR_HOUR_END,
  CALENDAR_HOUR_HEIGHT,
  CALENDAR_HOUR_START,
  getCalendarHours,
  getEventHeight,
  getEventTop,
  slotFromDropY,
} from '@/modules/calendar/utils/calendar-grid'
import { CalendarEventChip } from '@/modules/calendar/components/CalendarEventChip'
import { cn } from '@/utils/cn'

type TimeGridProps = {
  day: Date
  events: CalendarEvent[]
  onSelectEvent: (event: CalendarEvent) => void
  onReschedule: (interventionId: string, scheduledAt: string, durationMinutes: number) => void
}

export function TimeGrid({ day, events, onSelectEvent, onReschedule }: TimeGridProps) {
  const hours = useMemo(() => getCalendarHours(), [])
  const dayEvents = useMemo(() => eventsForDay(events, day), [events, day])
  const gridHeight = (CALENDAR_HOUR_END - CALENDAR_HOUR_START + 1) * CALENDAR_HOUR_HEIGHT

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const raw = e.dataTransfer.getData(CALENDAR_DRAG_MIME)
    if (!raw) return
    try {
      const payload = JSON.parse(raw) as { interventionId: string; durationMinutes: number }
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const y = e.clientY - rect.top
      const newStart = slotFromDropY(y, day)
      void onReschedule(payload.interventionId, newStart.toISOString(), payload.durationMinutes)
    } catch {
      // ignore invalid payload
    }
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-auto">
      <div className="w-14 shrink-0 border-r border-border/60 pt-2">
        {hours.map((hour) => (
          <div
            key={hour}
            className="pr-2 text-right text-[10px] tabular-nums text-text-muted"
            style={{ height: CALENDAR_HOUR_HEIGHT }}
          >
            {String(hour).padStart(2, '0')}:00
          </div>
        ))}
      </div>

      <div
        className={cn(
          'relative min-w-0 flex-1 border-r border-border/40 last:border-r-0',
          isToday(day) && 'bg-primary-muted/10',
        )}
        style={{ height: gridHeight }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {hours.map((hour, index) => (
          <div
            key={hour}
            className="absolute inset-x-0 border-t border-border/40"
            style={{ top: index * CALENDAR_HOUR_HEIGHT }}
          />
        ))}

        {dayEvents.map((event) => (
          <div
            key={event.id}
            className="absolute inset-x-1 z-10"
            style={{
              top: getEventTop(event.start),
              height: getEventHeight(event.durationMinutes),
            }}
          >
            <CalendarEventChip
              event={event}
              draggable
              onClick={() => onSelectEvent(event)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
