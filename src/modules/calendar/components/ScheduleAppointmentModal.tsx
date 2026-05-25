import { useEffect, useMemo, useState } from 'react'
import type { Client, Intervention, InterventionPriority, InterventionStatus } from '@/types/entities'
import type { ScheduleFormValues } from '@/modules/calendar/types/calendar-module.types'
import { toDateTimeLocalValue } from '@/modules/calendar/utils/calendar-dates'
import { ALL_PRIORITIES, ALL_STATUSES, PRIORITY_LABELS, STATUS_LABELS } from '@/modules/interventions/utils/intervention-labels'
import { getClientFullName } from '@/modules/clients/utils/client-name'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type ScheduleAppointmentModalProps = {
  open: boolean
  onClose: () => void
  clients: Client[]
  interventions: Intervention[]
  defaultDate?: Date
  saving?: boolean
  onSubmit: (values: ScheduleFormValues) => Promise<void>
}

const DURATION_OPTIONS = [30, 45, 60, 90, 120, 180]

export function ScheduleAppointmentModal({
  open,
  onClose,
  clients,
  interventions,
  defaultDate,
  saving,
  onSubmit,
}: ScheduleAppointmentModalProps) {
  const [clientId, setClientId] = useState('')
  const [reportedIssue, setReportedIssue] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [priority, setPriority] = useState<InterventionPriority>('medium')
  const [status, setStatus] = useState<InterventionStatus>('diagnostic')
  const [linkExisting, setLinkExisting] = useState(false)
  const [interventionId, setInterventionId] = useState('')

  const unscheduled = useMemo(
    () => interventions.filter((item) => !item.scheduledAt && item.status !== 'completed' && item.status !== 'returned'),
    [interventions],
  )

  useEffect(() => {
    if (!open) return
    const base = defaultDate ?? new Date()
    base.setMinutes(Math.ceil(base.getMinutes() / 15) * 15, 0, 0)
    setScheduledAt(toDateTimeLocalValue(base))
    setClientId(clients[0]?.id ?? '')
    setReportedIssue('')
    setDurationMinutes(60)
    setPriority('medium')
    setStatus('diagnostic')
    setLinkExisting(false)
    setInterventionId('')
  }, [open, defaultDate, clients])

  useEffect(() => {
    if (!linkExisting || !interventionId) return
    const selected = interventions.find((item) => item.id === interventionId)
    if (!selected) return
    setClientId(selected.clientId)
    setReportedIssue(selected.reportedIssue)
    setPriority(selected.priority ?? 'medium')
    setStatus(selected.status)
  }, [interventionId, interventions, linkExisting])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId || !reportedIssue.trim() || !scheduledAt) return
  await onSubmit({
      clientId,
      reportedIssue: reportedIssue.trim(),
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMinutes,
      priority,
      status,
      interventionId: linkExisting ? interventionId : undefined,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouveau rendez-vous"
      description="Planifier une intervention SAV avec date, durée et priorité."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button loading={saving} type="submit" form="schedule-appointment-form">
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="schedule-appointment-form" className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={linkExisting}
            onChange={(e) => setLinkExisting(e.target.checked)}
            className="rounded border-border"
          />
          Planifier une intervention existante
        </label>

        {linkExisting ? (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-text-primary">Intervention</span>
            <select
              value={interventionId}
              onChange={(e) => setInterventionId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="">Sélectionner…</option>
              {unscheduled.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.reportedIssue.slice(0, 60)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-text-primary">Client</span>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            disabled={linkExisting && Boolean(interventionId)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">Sélectionner…</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {getClientFullName(client)}
              </option>
            ))}
          </select>
        </label>

        <Input
          label="Motif / panne"
          value={reportedIssue}
          onChange={(e) => setReportedIssue(e.target.value)}
          disabled={linkExisting && Boolean(interventionId)}
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

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

        <p className="text-xs text-text-muted">
          Sync Google Calendar disponible — connectez votre compte dans Paramètres → Intégrations.
        </p>
      </form>
    </Modal>
  )
}
