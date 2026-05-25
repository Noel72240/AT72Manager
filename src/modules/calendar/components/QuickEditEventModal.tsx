import { useEffect, useState } from 'react'
import type { CalendarEvent } from '@/modules/calendar/types/calendar-module.types'
import type { InterventionPriority, InterventionStatus } from '@/types/entities'
import { toDateTimeLocalValue } from '@/modules/calendar/utils/calendar-dates'
import {
  ALL_PRIORITIES,
  ALL_STATUSES,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '@/modules/interventions/utils/intervention-labels'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

type QuickEditEventModalProps = {
  open: boolean
  event: CalendarEvent | null
  saving?: boolean
  onClose: () => void
  onSave: (payload: {
    interventionId: string
    scheduledAt: string
    durationMinutes: number
    priority: InterventionPriority
    status: InterventionStatus
  }) => Promise<void>
}

const DURATION_OPTIONS = [30, 45, 60, 90, 120, 180]

export function QuickEditEventModal({
  open,
  event,
  saving,
  onClose,
  onSave,
}: QuickEditEventModalProps) {
  const [scheduledAt, setScheduledAt] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [priority, setPriority] = useState<InterventionPriority>('medium')
  const [status, setStatus] = useState<InterventionStatus>('diagnostic')

  useEffect(() => {
    if (!event) return
    setScheduledAt(toDateTimeLocalValue(event.start))
    setDurationMinutes(event.durationMinutes)
    setPriority(event.priority)
    setStatus(event.status)
  }, [event])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!event) return
    await onSave({
      interventionId: event.interventionId,
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMinutes,
      priority,
      status,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Modifier le rendez-vous"
      description={event ? `${event.clientName} · ${event.title}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button loading={saving} type="submit" form="quick-edit-event-form">
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="quick-edit-event-form" className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-text-primary">Date & heure</span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-text-primary">Durée</span>
          <select
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            {DURATION_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value} min
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-text-primary">Priorité</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as InterventionPriority)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              {ALL_PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {PRIORITY_LABELS[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-text-primary">Statut</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as InterventionStatus)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              {ALL_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </form>
    </Modal>
  )
}
