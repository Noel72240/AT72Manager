import { useEffect, useMemo, useState } from 'react'
import type { Invoice } from '@/types/entities'
import type { DocumentPrefill } from '@/modules/commercial/types/commercial-module.types'
import {
  EMPTY_INVOICE_FORM,
  type InvoiceFormValues,
} from '@/modules/invoices/types/invoice-module.types'
import { useClients } from '@/modules/clients/hooks/useClients'
import { useInterventions } from '@/modules/interventions/hooks/useInterventions'
import { useDevices } from '@/modules/devices/hooks/useDevices'
import { useSpareParts } from '@/modules/parts/hooks/useSpareParts'
import { getClientFullName } from '@/modules/clients/utils/client-name'
import { getDeviceSummary } from '@/modules/devices/utils/device-labels'
import {
  ALL_INVOICE_STATUSES,
  INVOICE_STATUS_LABELS,
} from '@/modules/commercial/utils/commercial-labels'
import {
  LineItemsEditor,
  DocumentTotalsSummary,
  computeDocumentTotals,
  createEmptyLine,
} from '@/modules/commercial'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'

type InvoiceFormModalProps = {
  open: boolean
  invoice?: Invoice | null
  prefill?: DocumentPrefill | null
  saving?: boolean
  onClose: () => void
  onSubmit: (values: InvoiceFormValues) => Promise<void>
}

type FormErrors = Partial<Record<keyof InvoiceFormValues | 'lines', string>>

function defaultDueDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().slice(0, 10)
}

function invoiceToForm(invoice: Invoice): InvoiceFormValues {
  return {
    clientId: invoice.clientId,
    interventionId: invoice.interventionId ?? '',
    deviceId: invoice.deviceId ?? '',
    quoteId: invoice.quoteId ?? '',
    status: invoice.status,
    title: invoice.title ?? '',
    notes: invoice.notes ?? '',
    dueDate: invoice.dueDate?.slice(0, 10) ?? '',
    lines: invoice.lines,
  }
}

function prefillToForm(prefill: DocumentPrefill): InvoiceFormValues {
  return {
    ...EMPTY_INVOICE_FORM,
    clientId: prefill.clientId ?? '',
    interventionId: prefill.interventionId ?? '',
    deviceId: prefill.deviceId ?? '',
    title: prefill.title ?? '',
    notes: prefill.notes ?? '',
    dueDate: defaultDueDate(),
    lines: prefill.lines?.length ? prefill.lines : [createEmptyLine('labor')],
  }
}

function validate(values: InvoiceFormValues): FormErrors {
  const errors: FormErrors = {}
  if (!values.clientId) errors.clientId = 'Sélectionnez un client.'
  if (values.lines.length === 0) {
    errors.lines = 'Ajoutez au moins une ligne.'
  } else if (!values.lines.some((line) => line.description.trim())) {
    errors.lines = 'Renseignez la description d’au moins une ligne.'
  }
  return errors
}

const statusOptions = ALL_INVOICE_STATUSES.map((status) => ({
  value: status,
  label: INVOICE_STATUS_LABELS[status],
}))

export function InvoiceFormModal({
  open,
  invoice,
  prefill,
  saving = false,
  onClose,
  onSubmit,
}: InvoiceFormModalProps) {
  const isEditing = Boolean(invoice)
  const { clients } = useClients()
  const { interventions } = useInterventions()
  const { devices } = useDevices()
  const { parts: catalogParts } = useSpareParts()

  const [values, setValues] = useState<InvoiceFormValues>(EMPTY_INVOICE_FORM)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (!open) return
    if (invoice) {
      setValues(invoiceToForm(invoice))
    } else if (prefill) {
      setValues(prefillToForm(prefill))
    } else {
      setValues({
        ...EMPTY_INVOICE_FORM,
        dueDate: defaultDueDate(),
        lines: [createEmptyLine('labor')],
      })
    }
    setErrors({})
  }, [open, invoice, prefill])

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
      label: item.reportedIssue?.slice(0, 40) ?? 'Intervention',
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
      title={isEditing ? `Modifier ${invoice?.number}` : 'Nouvelle facture'}
      description="Facturation professionnelle — prête pour paiement & envoi mail"
      size="lg"
      className="max-w-4xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" form="invoice-form" loading={saving}>
            {isEditing ? 'Enregistrer' : 'Créer la facture'}
          </Button>
        </>
      }
    >
      <form id="invoice-form" className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            name="clientId"
            label="Client *"
            value={values.clientId}
            onChange={(event) =>
              setValues((prev) => ({
                ...prev,
                clientId: event.target.value,
                interventionId: '',
                deviceId: '',
              }))
            }
            options={[{ value: '', label: 'Sélectionner…' }, ...clientOptions]}
            error={errors.clientId}
            disabled={saving || Boolean(invoice?.quoteId)}
          />
          <Select
            name="status"
            label="Statut"
            value={values.status}
            onChange={(event) =>
              setValues((prev) => ({
                ...prev,
                status: event.target.value as InvoiceFormValues['status'],
              }))
            }
            options={statusOptions}
            disabled={saving}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            name="interventionId"
            label="Intervention"
            value={values.interventionId}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, interventionId: event.target.value }))
            }
            options={interventionOptions}
            disabled={saving || !values.clientId}
          />
          <Select
            name="deviceId"
            label="Appareil"
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
            disabled={saving}
          />
          <Input
            name="dueDate"
            label="Échéance"
            type="date"
            value={values.dueDate}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, dueDate: event.target.value }))
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
          À venir : lien de paiement, relances automatiques, envoi e-mail, signature.
        </div>
      </form>
    </Modal>
  )
}
