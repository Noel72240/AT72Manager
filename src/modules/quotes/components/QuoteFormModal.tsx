import { useEffect, useMemo, useState } from 'react'
import type { Quote } from '@/types/entities'
import type { DocumentPrefill } from '@/modules/commercial/types/commercial-module.types'
import {
  EMPTY_QUOTE_FORM,
  type QuoteFormValues,
} from '@/modules/quotes/types/quote-module.types'
import { useClients } from '@/modules/clients/hooks/useClients'
import { useSpareParts } from '@/modules/parts/hooks/useSpareParts'
import { useInterventions } from '@/modules/interventions/hooks/useInterventions'
import { useDevices } from '@/modules/devices/hooks/useDevices'
import { getClientFullName } from '@/modules/clients/utils/client-name'
import { ALL_QUOTE_STATUSES, QUOTE_STATUS_LABELS } from '@/modules/commercial/utils/commercial-labels'
import {
  LineItemsEditor,
  DocumentTotalsSummary,
  computeDocumentTotals,
  createEmptyLine,
} from '@/modules/commercial'
import { getDeviceSummary } from '@/modules/devices/utils/device-labels'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'

type QuoteFormModalProps = {
  open: boolean
  quote?: Quote | null
  prefill?: DocumentPrefill | null
  saving?: boolean
  onClose: () => void
  onSubmit: (values: QuoteFormValues) => Promise<void>
}

type FormErrors = Partial<Record<keyof QuoteFormValues | 'lines', string>>

function defaultValidUntil(): string {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().slice(0, 10)
}

function quoteToForm(quote: Quote): QuoteFormValues {
  return {
    clientId: quote.clientId,
    interventionId: quote.interventionId ?? '',
    deviceId: quote.deviceId ?? '',
    status: quote.status,
    title: quote.title ?? '',
    notes: quote.notes ?? '',
    validUntil: quote.validUntil?.slice(0, 10) ?? '',
    lines: quote.lines,
  }
}

function prefillToForm(prefill: DocumentPrefill): QuoteFormValues {
  return {
    ...EMPTY_QUOTE_FORM,
    clientId: prefill.clientId ?? '',
    interventionId: prefill.interventionId ?? '',
    deviceId: prefill.deviceId ?? '',
    title: prefill.title ?? '',
    notes: prefill.notes ?? '',
    validUntil: defaultValidUntil(),
    lines: prefill.lines?.length ? prefill.lines : [createEmptyLine('labor')],
  }
}

function validate(values: QuoteFormValues): FormErrors {
  const errors: FormErrors = {}
  if (!values.clientId) errors.clientId = 'Sélectionnez un client.'
  if (values.lines.length === 0) {
    errors.lines = 'Ajoutez au moins une ligne.'
  } else if (!values.lines.some((line) => line.description.trim())) {
    errors.lines = 'Renseignez la description d’au moins une ligne.'
  }
  return errors
}

const statusOptions = ALL_QUOTE_STATUSES.map((status) => ({
  value: status,
  label: QUOTE_STATUS_LABELS[status],
}))

export function QuoteFormModal({
  open,
  quote,
  prefill,
  saving = false,
  onClose,
  onSubmit,
}: QuoteFormModalProps) {
  const isEditing = Boolean(quote)
  const { clients } = useClients()
  const { interventions } = useInterventions()
  const { devices } = useDevices()
  const { parts: catalogParts } = useSpareParts()

  const [values, setValues] = useState<QuoteFormValues>(EMPTY_QUOTE_FORM)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (!open) return
    if (quote) {
      setValues(quoteToForm(quote))
    } else if (prefill) {
      setValues(prefillToForm(prefill))
    } else {
      setValues({
        ...EMPTY_QUOTE_FORM,
        validUntil: defaultValidUntil(),
        lines: [createEmptyLine('labor')],
      })
    }
    setErrors({})
  }, [open, quote, prefill])

  const clientOptions = useMemo(
    () =>
      clients.map((client) => ({
        value: client.id,
        label: getClientFullName(client),
      })),
    [clients],
  )

  const filteredInterventions = useMemo(
    () =>
      values.clientId
        ? interventions.filter((item) => item.clientId === values.clientId)
        : interventions,
    [interventions, values.clientId],
  )

  const filteredDevices = useMemo(
    () =>
      values.clientId
        ? devices.filter((item) => item.clientId === values.clientId)
        : devices,
    [devices, values.clientId],
  )

  const interventionOptions = [
    { value: '', label: '— Aucune —' },
    ...filteredInterventions.map((item) => ({
      value: item.id,
      label: `${item.reportedIssue?.slice(0, 40) ?? 'Intervention'} (${item.status})`,
    })),
  ]

  const deviceOptions = [
    { value: '', label: '— Aucun —' },
    ...filteredDevices.map((item) => ({
      value: item.id,
      label: getDeviceSummary(item),
    })),
  ]

  const totals = useMemo(() => computeDocumentTotals(values.lines), [values.lines])

  const handleClientChange = (clientId: string) => {
    setValues((prev) => ({
      ...prev,
      clientId,
      interventionId: '',
      deviceId: '',
    }))
  }

  const handleInterventionChange = (interventionId: string) => {
    const intervention = interventions.find((item) => item.id === interventionId)
    if (!intervention) {
      setValues((prev) => ({ ...prev, interventionId: '' }))
      return
    }

    const lines =
      values.lines.length === 1 && !values.lines[0]?.description.trim()
        ? [
            {
              ...createEmptyLine('labor'),
              description: intervention.reportedIssue ?? 'Intervention SAV',
              unitPrice: intervention.estimatedPrice ?? 0,
            },
          ]
        : values.lines

    setValues((prev) => ({
      ...prev,
      interventionId,
      clientId: intervention.clientId,
      deviceId: intervention.deviceId ?? prev.deviceId,
      title: prev.title || intervention.reportedIssue?.slice(0, 80) || '',
      lines,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const nextErrors = validate(values)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    await onSubmit(values)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? `Modifier ${quote?.number}` : 'Nouveau devis'}
      description="Devis professionnel — pièces, main d'œuvre, TVA compatible"
      size="lg"
      className="max-w-4xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" form="quote-form" loading={saving}>
            {isEditing ? 'Enregistrer' : 'Créer le devis'}
          </Button>
        </>
      }
    >
      <form id="quote-form" className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            name="clientId"
            label="Client *"
            value={values.clientId}
            onChange={(event) => handleClientChange(event.target.value)}
            options={[{ value: '', label: 'Sélectionner…' }, ...clientOptions]}
            error={errors.clientId}
            disabled={saving}
          />
          <Select
            name="status"
            label="Statut"
            value={values.status}
            onChange={(event) =>
              setValues((prev) => ({
                ...prev,
                status: event.target.value as QuoteFormValues['status'],
              }))
            }
            options={statusOptions}
            disabled={saving}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            name="interventionId"
            label="Intervention liée"
            value={values.interventionId}
            onChange={(event) => handleInterventionChange(event.target.value)}
            options={interventionOptions}
            disabled={saving || !values.clientId}
          />
          <Select
            name="deviceId"
            label="Appareil lié"
            value={values.deviceId}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, deviceId: event.target.value }))
            }
            options={deviceOptions}
            disabled={saving || !values.clientId}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="title"
            label="Objet"
            value={values.title}
            onChange={(event) => setValues((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Réparation écran, remplacement batterie…"
            disabled={saving}
          />
          <Input
            name="validUntil"
            label="Valable jusqu'au"
            type="date"
            value={values.validUntil}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, validUntil: event.target.value }))
            }
            disabled={saving}
          />
        </div>

        <LineItemsEditor
          lines={values.lines}
          onChange={(lines) => setValues((prev) => ({ ...prev, lines }))}
          disabled={saving}
          catalogParts={catalogParts}
        />
        {errors.lines ? <p className="text-xs text-danger">{errors.lines}</p> : null}

        <DocumentTotalsSummary totals={totals} />

        <Textarea
          name="notes"
          label="Notes"
          value={values.notes}
          onChange={(event) => setValues((prev) => ({ ...prev, notes: event.target.value }))}
          rows={3}
          disabled={saving}
        />

        <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-text-muted">
          À venir : signature électronique, envoi par e-mail, paiement en ligne, génération IA.
        </div>
      </form>
    </Modal>
  )
}
