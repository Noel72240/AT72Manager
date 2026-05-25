import type { CalendarEvent } from '@/modules/calendar/types/calendar-module.types'
import { getEventColorClasses, getPriorityDotClass } from '@/modules/calendar/utils/calendar-colors'
import { formatTime } from '@/modules/calendar/utils/calendar-dates'
import { CALENDAR_DRAG_MIME } from '@/modules/calendar/utils/calendar-events'
import { cn } from '@/utils/cn'

type CalendarEventChipProps = {
  event: CalendarEvent
  compact?: boolean
  draggable?: boolean
  style?: React.CSSProperties
  onClick?: () => void
}

export function CalendarEventChip({
  event,
  compact = false,
  draggable = false,
  style,
  onClick,
}: CalendarEventChipProps) {
  const colorClass = getEventColorClasses(event)

  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    if (!draggable) return
    e.dataTransfer.setData(
      CALENDAR_DRAG_MIME,
      JSON.stringify({ interventionId: event.interventionId, durationMinutes: event.durationMinutes }),
    )
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      style={style}
      className={cn(
        'group w-full overflow-hidden rounded-lg border ring-1 transition-all hover:shadow-card',
        colorClass,
        draggable && 'cursor-grab active:cursor-grabbing',
        compact ? 'text-[10px]' : 'text-xs',
      )}
    >
      <button type="button" onClick={onClick} className="w-full px-2 py-1.5 text-left">
        <div className="flex items-center gap-1.5">
          <span className={cn('size-1.5 shrink-0 rounded-full', getPriorityDotClass(event.priority))} />
          <span className="truncate font-semibold">{formatTime(event.start)}</span>
          {!compact ? <span className="truncate opacity-80">{event.clientName}</span> : null}
        </div>
        <p className={cn('truncate font-medium', compact ? 'mt-0.5' : 'mt-1')}>{event.title}</p>
        {!compact ? (
          <p className="mt-0.5 truncate text-[10px] opacity-70">{event.deviceSummary}</p>
        ) : null}
      </button>
    </div>
  )
}
