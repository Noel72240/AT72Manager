import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import type { InterventionFormValues } from '@/modules/interventions/types/intervention-module.types'
import {
  ALL_PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
} from '@/modules/interventions/utils/payment-labels'
import { buildQontoOpenUrl, getQontoAppUrl } from '@/services/settings/qonto-settings.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

type InterventionBillingSectionProps = {
  values: InterventionFormValues
  disabled?: boolean
  onChange: <K extends keyof InterventionFormValues>(
    field: K,
    value: InterventionFormValues[K],
  ) => void
}

export function InterventionBillingSection({
  values,
  disabled,
  onChange,
}: InterventionBillingSectionProps) {
  const [qontoBaseUrl, setQontoBaseUrl] = useState('https://app.qonto.com')

  useEffect(() => {
    void getQontoAppUrl().then(setQontoBaseUrl)
  }, [])

  const paymentOptions = ALL_PAYMENT_STATUSES.map((status) => ({
    value: status,
    label: PAYMENT_STATUS_LABELS[status],
  }))

  function openQonto() {
    const url = buildQontoOpenUrl(qontoBaseUrl, values.externalInvoiceRef, values.qontoDocumentUrl)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        Paiement & Qonto
      </h4>
      <p className="text-xs text-text-muted">
        La facturation légale se fait dans Qonto. Indiquez ici le suivi atelier (acompte, statut,
        référence).
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Acompte (€)"
          type="number"
          min="0"
          step="0.01"
          value={values.depositAmount}
          onChange={(e) => onChange('depositAmount', e.target.value)}
          disabled={disabled}
          placeholder="50.00"
        />
        <Select
          label="Statut paiement"
          value={values.paymentStatus}
          onChange={(e) =>
            onChange('paymentStatus', e.target.value as InterventionFormValues['paymentStatus'])
          }
          options={paymentOptions}
          disabled={disabled}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={values.billedViaQonto}
          onChange={(e) => onChange('billedViaQonto', e.target.checked)}
          disabled={disabled}
          className="rounded border-border"
        />
        Facturé via Qonto
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Référence facture externe"
          value={values.externalInvoiceRef}
          onChange={(e) => onChange('externalInvoiceRef', e.target.value)}
          disabled={disabled}
          placeholder="FAC-2026-0042"
        />
        <Input
          label="Lien document Qonto (optionnel)"
          value={values.qontoDocumentUrl}
          onChange={(e) => onChange('qontoDocumentUrl', e.target.value)}
          disabled={disabled}
          placeholder="https://app.qonto.com/..."
        />
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        leftIcon={<ExternalLink className="h-4 w-4" />}
        onClick={openQonto}
      >
        Ouvrir Qonto
      </Button>
    </section>
  )
}
