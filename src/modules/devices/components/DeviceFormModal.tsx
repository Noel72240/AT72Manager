import { useEffect, useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { Client } from '@/types/entities'
import type { Device } from '@/types/entities/device.types'
import type { DeviceFormValues } from '@/modules/devices/types/device-module.types'
import {
  EMPTY_DEVICE_FORM,
  FUTURE_DEVICE_FEATURES,
} from '@/modules/devices/types/device-module.types'
import { CONDITION_LABELS } from '@/modules/devices/components/DeviceConditionBadge'
import { ALL_CONDITIONS, COLOR_OPTIONS, STORAGE_OPTIONS } from '@/modules/devices/utils/device-labels'
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
import { Badge } from '@/components/ui/Badge'

type DeviceFormModalProps = {
  open: boolean
  device?: Device | null
  clients: Client[]
  saving?: boolean
  onClose: () => void
  onSubmit: (values: DeviceFormValues) => Promise<void>
}

type FormErrors = Partial<Record<keyof DeviceFormValues, string>>

function deviceToFormValues(device: Device): DeviceFormValues {
  const { model, customModel } = matchModelInCatalog(
    device.deviceType,
    device.brand ?? '',
    device.model ?? '',
  )

  return {
    clientId: device.clientId,
    deviceType: device.deviceType,
    brand: device.brand ?? '',
    model,
    customModel,
    serialNumber: device.serialNumber ?? '',
    imei: device.imei ?? '',
    storageCapacity: device.storageCapacity ?? '',
    color: device.color ?? '',
    condition: device.condition,
    notes: device.notes ?? '',
  }
}

function validate(values: DeviceFormValues, clients: Client[]): FormErrors {
  const errors: FormErrors = {}
  const clientExists = clients.some((client) => client.id === values.clientId)

  if (!values.clientId || !clientExists) {
    errors.clientId = 'Sélectionnez un client.'
  }
  if (!values.deviceType) {
    errors.deviceType = 'Sélectionnez un type d\'appareil.'
  }
  if (values.model === CUSTOM_OPTION_VALUE && !values.customModel.trim()) {
    errors.customModel = 'Indiquez le modèle.'
  }
  return errors
}

export function DeviceFormModal({
  open,
  device,
  clients,
  saving = false,
  onClose,
  onSubmit,
}: DeviceFormModalProps) {
  const isEditing = Boolean(device)
  const [values, setValues] = useState<DeviceFormValues>(EMPTY_DEVICE_FORM)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (!open) return
    setValues(device ? deviceToFormValues(device) : EMPTY_DEVICE_FORM)
    setErrors({})
  }, [open, device])

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

  const deviceTypeOptions = useMemo(
    () => toSelectOptions(DEVICE_CATEGORIES, 'Choisir un type…'),
    [],
  )

  const brandOptions = useMemo(() => {
    if (!values.deviceType) {
      return [{ value: '', label: 'Choisir un type d\'abord' }]
    }
    return toSelectOptions(getBrandOptions(values.deviceType), 'Choisir une marque…')
  }, [values.deviceType])

  const modelOptions = useMemo(() => {
    if (!values.brand) {
      return [{ value: '', label: 'Choisir une marque d\'abord' }]
    }
    return toSelectOptions(getModelOptions(values.deviceType, values.brand), 'Choisir un modèle…', true)
  }, [values.deviceType, values.brand])

  const storageOptions = useMemo(
    () => [
      { value: '', label: 'Non renseigné' },
      ...STORAGE_OPTIONS.map((item) => ({ value: item, label: item })),
    ],
    [],
  )

  const colorOptions = useMemo(
    () => [
      { value: '', label: 'Non renseignée' },
      ...COLOR_OPTIONS.map((item) => ({ value: item, label: item })),
    ],
    [],
  )

  const conditionOptions = ALL_CONDITIONS.map((condition) => ({
    value: condition,
    label: CONDITION_LABELS[condition],
  }))

  const handleChange = <K extends keyof DeviceFormValues>(field: K, value: DeviceFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleDeviceTypeChange = (deviceType: string) => {
    setValues((prev) => ({
      ...prev,
      deviceType,
      brand: '',
      model: '',
      customModel: '',
    }))
    setErrors((prev) => ({
      ...prev,
      deviceType: undefined,
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
      title={isEditing ? 'Modifier l\'appareil' : 'Nouvel appareil'}
      description={
        isEditing
          ? 'Mettez à jour la fiche appareil du parc client.'
          : 'Enregistrez un appareil lié à un client pour le suivi SAV.'
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" form="device-form" loading={saving}>
            {isEditing ? 'Enregistrer' : 'Créer l\'appareil'}
          </Button>
        </>
      }
    >
      <form id="device-form" onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Client & identification
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
              name="deviceType"
              label="Type appareil *"
              value={values.deviceType}
              onChange={(event) => handleDeviceTypeChange(event.target.value)}
              options={deviceTypeOptions}
              error={errors.deviceType}
            />
            <Select
              name="brand"
              label="Marque"
              value={values.brand}
              onChange={(event) => handleBrandChange(event.target.value)}
              options={brandOptions}
              disabled={!values.deviceType}
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
                placeholder="Ex. iPhone 16e…"
                className="sm:col-span-2"
              />
            ) : null}
            <Input
              name="serialNumber"
              label="Numéro série"
              value={values.serialNumber}
              onChange={(event) => handleChange('serialNumber', event.target.value)}
              placeholder="SN-123456789"
            />
            <Input
              name="imei"
              label="IMEI"
              value={values.imei}
              onChange={(event) => handleChange('imei', event.target.value)}
              placeholder="356938035643809"
            />
            <Select
              name="storageCapacity"
              label="Capacité stockage"
              value={values.storageCapacity}
              onChange={(event) => handleChange('storageCapacity', event.target.value)}
              options={storageOptions}
            />
            <Select
              name="color"
              label="Couleur"
              value={values.color}
              onChange={(event) => handleChange('color', event.target.value)}
              options={colorOptions}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            État & notes
          </h4>
          <Select
            name="condition"
            label="État appareil"
            value={values.condition}
            onChange={(event) =>
              handleChange('condition', event.target.value as DeviceFormValues['condition'])
            }
            options={conditionOptions}
          />
          <Textarea
            name="notes"
            label="Notes"
            value={values.notes}
            onChange={(event) => handleChange('notes', event.target.value)}
            placeholder="Accessoires fournis, dommages visibles, remarques…"
            rows={3}
          />
        </section>

        <section className="rounded-lg border border-dashed border-border/80 bg-surface-hover/20 px-4 py-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-text-secondary">
            <Sparkles className="size-4 text-neon-blue" />
            Fonctionnalités à venir
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.values(FUTURE_DEVICE_FEATURES).map((label) => (
              <Badge key={label} variant="default" className="opacity-70">
                {label}
              </Badge>
            ))}
          </div>
        </section>
      </form>
    </Modal>
  )
}

export { resolveStoredModel }
