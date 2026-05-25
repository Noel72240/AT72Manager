import type { CalendarEvent } from '@/modules/calendar/types/calendar-module.types'
import { TimeGrid } from '@/modules/calendar/components/TimeGrid'

type DayViewProps = {
  day: Date
  events: CalendarEvent[]
  onSelectEvent: (event: CalendarEvent) => void
  onReschedule: (interventionId: string, scheduledAt: string, durationMinutes: number) => void
}

export function DayView({ day, events, onSelectEvent, onReschedule }: DayViewProps) {
  return (
    <div className="flex h-full min-h-[640px] flex-col overflow-hidden rounded-xl border border-border bg-surface-elevated/40">
      <TimeGrid day={day} events={events} onSelectEvent={onSelectEvent} onReschedule={onReschedule} />
    </div>
  )
}
