import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { CalendarViewMode } from '@/modules/calendar/types/calendar-module.types'
import { formatCalendarTitle } from '@/modules/calendar/utils/calendar-dates'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

type CalendarToolbarProps = {
  view: CalendarViewMode
  anchorDate: Date
  onViewChange: (view: CalendarViewMode) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onNewAppointment: () => void
}

const VIEW_OPTIONS: Array<{ id: CalendarViewMode; label: string }> = [
  { id: 'day', label: 'Jour' },
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
]

export function CalendarToolbar({
  view,
  anchorDate,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onNewAppointment,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
          Planning <span className="gradient-text">SAV</span>
        </h2>
        <p className="mt-1 text-sm capitalize text-text-secondary">
          {formatCalendarTitle(view, anchorDate)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-border bg-surface-elevated/60 p-1">
          <Button variant="ghost" size="sm" aria-label="Période précédente" onClick={onPrev}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToday}>
            Aujourd&apos;hui
          </Button>
          <Button variant="ghost" size="sm" aria-label="Période suivante" onClick={onNext}>
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="flex rounded-lg border border-border bg-surface-elevated/60 p-1">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onViewChange(option.id)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                view === option.id
                  ? 'bg-primary-muted text-neon-blue ring-1 ring-neon-blue/20'
                  : 'text-text-muted hover:text-text-primary',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Button leftIcon={<Plus className="size-4" />} onClick={onNewAppointment}>
          Rendez-vous
        </Button>
      </div>
    </div>
  )
}
