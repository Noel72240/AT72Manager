import { useEffect, useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { Client } from '@/types/entities'
import type { Intervention } from '@/types/entities/intervention.types'
import type { InterventionFormValues } from '@/modules/interventions/types/intervention-module.types'
import {
  EMPTY_INTERVENTION_FORM,
  FUTURE_INTERVENTION_FEATURES,
} from '@/modules/interventions/types/intervention-module.types'
import { InterventionFieldSection } from '@/modules/interventions/field/components/InterventionFieldSection'
import { normalizeInterventionMedia } from '@/modules/interventions/field/utils/media-utils'
import { STATUS_LABELS } from '@/modules/interventions/components/InterventionStatusBadge'
import { ALL_STATUSES } from '@/modules/interventions/utils/intervention-labels'
import {
  CUSTOM_OPTION_VALUE,
  DEVICE_CATEGORIES,
  getBrandOptions,
  getModelOptions,
  matchModelInCatalog,
  resolveStoredModel,
  toSelectOptions,
} from '@/modules/interventions/utils/device-catalog'
import { getClientFullName } from '@/modules/clients/utils/client-name'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import {
  LineItemsEditor,
  DocumentTotalsSummary,
  computeDocumentTotals,
  createEmptyLine,
} from '@/modules/commercial'
import { computeLinesCost, computeLinesProfit } from '@/modules/inventory/utils/margin'
import { useSpareParts } from '@/modules/parts/hooks/useSpareParts'
import { formatPrice } from '@/modules/commercial/utils/format-price'

type InterventionFormModalProps = {
  open: boolean
  intervention?: Intervention | null
  clients: Client[]
  saving?: boolean
  onClose: () => void
  onSubmit: (values: InterventionFormValues) => Promise<void>
}

type FormErrors = Partial<Record<keyof InterventionFormValues, string>>

function interventionToFormValues(intervention: Intervention): InterventionFormValues {
  const category = intervention.deviceLabel ?? ''
  const brand = intervention.brand ?? ''
  const { model, customModel } = matchModelInCatalog(category, brand, intervention.model ?? '')

  return {
    clientId: intervention.clientId,
    deviceLabel: category,
    brand,
    model,
    customModel,
    imeiOrSerial: intervention.imeiOrSerial ?? '',
    reportedIssue: intervention.reportedIssue,
    diagnostic: intervention.diagnostic ?? '',
    technicianNotes: intervention.technicianNotes ?? '',
    status: intervention.status,
    estimatedPrice:
      intervention.estimatedPrice !== undefined ? String(intervention.estimatedPrice) : '',
    finalPrice: intervention.finalPrice !== undefined ? String(intervention.finalPrice) : '',
    media: normalizeInterventionMedia(intervention.media),
    partsLines: intervention.partsLines?.length
      ? intervention.partsLines
      : [createEmptyLine('part')],
  }
}

function validate(values: InterventionFormValues, clients: Client[]): FormErrors {
  const errors: FormErrors = {}
  const clientExists = clients.some((client) => client.id === values.clientId)

  if (!values.clientId || !clientExists) {
    errors.clientId = 'Sélectionnez un client.'
  }
  if (!values.reportedIssue.trim()) {
    errors.reportedIssue = 'La panne signalée est obligatoire.'
  }
  if (values.model === CUSTOM_OPTION_VALUE && !values.customModel.trim()) {
    errors.customModel = 'Indiquez le modèle.'
  }
  if (values.estimatedPrice.trim() && Number.isNaN(Number(values.estimatedPrice))) {
    errors.estimatedPrice = 'Montant invalide.'
  }
  if (values.finalPrice.trim() && Number.isNaN(Number(values.finalPrice))) {
    errors.finalPrice = 'Montant invalide.'
  }
  return errors
}

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function parseOptionalPrice(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const num = Number(trimmed)
  return Number.isFinite(num) ? num : undefined
}

export function InterventionFormModal({
  open,
  intervention,
  clients,
  saving = false,
  onClose,
  onSubmit,
}: InterventionFormModalProps) {
  const isEditing = Boolean(intervention)
  const { parts: catalogParts } = useSpareParts()
  const [values, setValues] = useState<InterventionFormValues>(EMPTY_INTERVENTION_FORM)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (!open) return
    setValues(intervention ? interventionToFormValues(intervention) : EMPTY_INTERVENTION_FORM)
    setErrors({})
  }, [open, intervention])

  const clientOptions = useMemo(() => {
    if (clients.length === 0) {
      return [{ value: '', label: 'Aucun client — créez-en un d\'abord' }]
    }
    return [
      { value: '', label: 'Sélectionner un client…' },
      ...clients.map((client) => ({
        value: client.id,
        label: getClientFullName(client),
      })),
    ]
  }, [clients])

  const deviceCategoryOptions = useMemo(
    () => toSelectOptions(DEVICE_CATEGORIES, 'Choisir une catégorie…'),
    [],
  )

  const brandOptions = useMemo(() => {
    if (!values.deviceLabel) {
      return [{ value: '', label: 'Choisir une catégorie d\'abord' }]
    }
    return toSelectOptions(getBrandOptions(values.deviceLabel), 'Choisir une marque…')
  }, [values.deviceLabel])

  const modelOptions = useMemo(() => {
    if (!values.brand) {
      return [{ value: '', label: 'Choisir une marque d\'abord' }]
    }
    return toSelectOptions(getModelOptions(values.deviceLabel, values.brand), 'Choisir un modèle…', true)
  }, [values.deviceLabel, values.brand])

  const statusOptions = ALL_STATUSES.map((status) => ({
    value: status,
    label: STATUS_LABELS[status],
  }))

  const handleChange = <K extends keyof InterventionFormValues>(
    field: K,
    value: InterventionFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleDeviceCategoryChange = (category: string) => {
    setValues((prev) => ({
      ...prev,
      deviceLabel: category,
      brand: '',
      model: '',
      customModel: '',
    }))
    setErrors((prev) => ({
      ...prev,
      deviceLabel: undefined,
      brand: undefined,
      model: undefined,
      customModel: undefined,
    }))
  }

  const handleBrandChange = (brand: string) => {
    setValues((prev) => ({
      ...prev,
      brand,
      model: '',
      customModel: '',
    }))
    setErrors((prev) => ({
      ...prev,
      brand: undefined,
      model: undefined,
      customModel: undefined,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const nextErrors = validate(values, clients)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    await onSubmit(values)
  }

  const showCustomModel = values.model === CUSTOM_OPTION_VALUE

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Modifier l\'intervention' : 'Nouvelle intervention'}
      description={
        isEditing
          ? 'Mettez à jour la fiche SAV et le suivi de réparation.'
          : 'Créez une fiche d\'intervention complète pour le suivi atelier.'
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" form="intervention-form" loading={saving}>
            {isEditing ? 'Enregistrer' : 'Créer l\'intervention'}
          </Button>
        </>
      }
    >
      <form id="intervention-form" onSubmit={handleSubmit} className="space-y-6">
        {isEditing && intervention ? (
          <div className="rounded-lg border border-border/60 bg-surface-hover/30 px-4 py-3 text-sm text-text-secondary">
            Créée le <span className="font-medium text-text-primary">{formatCreatedAt(intervention.createdAt)}</span>
          </div>
        ) : null}

        <section className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Client & appareil
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              name="clientId"
              label="Client lié *"
              value={values.clientId}
              onChange={(event) => handleChange('clientId', event.target.value)}
              options={clientOptions}
              error={errors.clientId}
              disabled={clients.length === 0}
            />
            <Select
              name="deviceLabel"
              label="Catégorie appareil"
              value={values.deviceLabel}
              onChange={(event) => handleDeviceCategoryChange(event.target.value)}
              options={deviceCategoryOptions}
            />
            <Select
              name="brand"
              label="Marque"
              value={values.brand}
              onChange={(event) => handleBrandChange(event.target.value)}
              options={brandOptions}
              disabled={!values.deviceLabel}
            />
            <Select
              name="model"
              label="Modèle"
              value={values.model}
              onChange={(event) => handleChange('model', event.target.value)}
              options={modelOptions}
              disabled={!values.brand}
            />
            {showCustomModel ? (
              <Input
                name="customModel"
                label="Modèle (saisie libre)"
                value={values.customModel}
                onChange={(event) => handleChange('customModel', event.target.value)}
                error={errors.customModel}
                placeholder="Ex. iPhone 16e, Galaxy A06…"
                className="sm:col-span-2"
              />
            ) : null}
            <Input
              name="imeiOrSerial"
              label="IMEI / numéro série"
              value={values.imeiOrSerial}
              onChange={(event) => handleChange('imeiOrSerial', event.target.value)}
              placeholder="356938035643809"
              className="sm:col-span-2"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Diagnostic SAV
          </h4>
          <Textarea
            name="reportedIssue"
            label="Panne signalée *"
            value={values.reportedIssue}
            onChange={(event) => handleChange('reportedIssue', event.target.value)}
            error={errors.reportedIssue}
            placeholder="Écran cassé, ne s'allume plus…"
            rows={3}
          />
          <Textarea
            name="diagnostic"
            label="Diagnostic"
            value={values.diagnostic}
            onChange={(event) => handleChange('diagnostic', event.target.value)}
            placeholder="Constats atelier, tests effectués…"
            rows={3}
          />
          <Textarea
            name="technicianNotes"
            label="Notes technicien"
            value={values.technicianNotes}
            onChange={(event) => handleChange('technicianNotes', event.target.value)}
            placeholder="Pièces commandées, remarques internes…"
            rows={3}
          />
          <Select
            name="status"
            label="Statut"
            value={values.status}
            onChange={(event) =>
              handleChange('status', event.target.value as InterventionFormValues['status'])
            }
            options={statusOptions}
          />
        </section>

        <section className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Pièces & coût intervention
          </h4>
          <LineItemsEditor
            lines={values.partsLines}
            onChange={(partsLines) => handleChange('partsLines', partsLines)}
            disabled={saving}
            catalogParts={catalogParts}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <DocumentTotalsSummary totals={computeDocumentTotals(values.partsLines)} />
            <div className="rounded-xl border border-border/70 bg-surface-hover/20 p-4 text-sm space-y-2">
              <p>
                Coût pièces :{' '}
                <span className="font-semibold">{formatPrice(computeLinesCost(values.partsLines))}</span>
              </p>
              <p>
                Marge pièces :{' '}
                <span className="font-semibold text-neon-green">
                  {formatPrice(computeLinesProfit(values.partsLines))}
                </span>
              </p>
              <p className="text-xs text-text-muted">
                Le stock est décrémenté lorsque l&apos;intervention passe au statut « Terminée ».
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Tarification
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="estimatedPrice"
              label="Prix estimé (€)"
              type="number"
              min="0"
              step="0.01"
              value={values.estimatedPrice}
              onChange={(event) => handleChange('estimatedPrice', event.target.value)}
              error={errors.estimatedPrice}
              placeholder="89.00"
            />
            <Input
              name="finalPrice"
              label="Prix final (€)"
              type="number"
              min="0"
              step="0.01"
              value={values.finalPrice}
              onChange={(event) => handleChange('finalPrice', event.target.value)}
              error={errors.finalPrice}
              placeholder="95.00"
            />
          </div>
        </section>

        <section className="space-y-4 border-t border-border/60 pt-6">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Terrain SAV — photos & signatures
          </h4>
          <InterventionFieldSection
            media={values.media}
            onChange={(media) => handleChange('media', media)}
            disabled={saving}
            formValues={values}
            intervention={intervention}
            onApplyAiField={(field, value) => handleChange(field, value)}
          />
        </section>

        <section className="rounded-lg border border-dashed border-border/80 bg-surface-hover/20 px-4 py-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-text-secondary">
            <Sparkles className="size-4 text-neon-blue" />
            {FUTURE_INTERVENTION_FEATURES.cloudSync}
          </div>
        </section>
      </form>
    </Modal>
  )
}

export { parseOptionalPrice, resolveStoredModel }
