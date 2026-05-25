import { useEffect, useState } from 'react'
import type { Client } from '@/types/entities'
import type { ClientFormValues } from '@/modules/clients/types/client-module.types'
import { EMPTY_CLIENT_FORM } from '@/modules/clients/types/client-module.types'
import { STATUS_LABELS } from '@/modules/clients/components/ClientStatusBadge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { ClientPortalPanel } from '@/modules/clients/components/ClientPortalPanel'

type ClientFormModalProps = {
  open: boolean
  client?: Client | null
  saving?: boolean
  onClose: () => void
  onSubmit: (values: ClientFormValues) => Promise<void>
}

type FormErrors = Partial<Record<keyof ClientFormValues, string>>

function clientToFormValues(client: Client): ClientFormValues {
  return {
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email ?? '',
    phone: client.phone ?? '',
    address: client.address ?? '',
    notes: client.notes ?? '',
    status: client.status,
  }
}

function validate(values: ClientFormValues): FormErrors {
  const errors: FormErrors = {}
  if (!values.firstName.trim()) {
    errors.firstName = 'Le prénom est obligatoire.'
  }
  return errors
}

const statusOptions = [
  { value: 'active' as const, label: STATUS_LABELS.active },
  { value: 'inactive' as const, label: STATUS_LABELS.inactive },
  { value: 'prospect' as const, label: STATUS_LABELS.prospect },
]

export function ClientFormModal({
  open,
  client,
  saving = false,
  onClose,
  onSubmit,
}: ClientFormModalProps) {
  const isEditing = Boolean(client)
  const [values, setValues] = useState<ClientFormValues>(EMPTY_CLIENT_FORM)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (!open) return
    setValues(client ? clientToFormValues(client) : EMPTY_CLIENT_FORM)
    setErrors({})
  }, [open, client])

  const handleChange = <K extends keyof ClientFormValues>(field: K, value: ClientFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
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
      title={isEditing ? 'Modifier le client' : 'Nouveau client'}
      description={
        isEditing
          ? 'Mettez à jour les informations du client.'
          : 'Ajoutez un nouveau client à votre carnet d\'adresses.'
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" form="client-form" loading={saving}>
            {isEditing ? 'Enregistrer' : 'Créer le client'}
          </Button>
        </>
      }
    >
      <form id="client-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="firstName"
            label="Prénom *"
            value={values.firstName}
            onChange={(event) => handleChange('firstName', event.target.value)}
            error={errors.firstName}
            placeholder="Jean"
            autoFocus
          />
          <Input
            name="lastName"
            label="Nom"
            value={values.lastName}
            onChange={(event) => handleChange('lastName', event.target.value)}
            placeholder="Dupont"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="phone"
            label="Téléphone"
            type="tel"
            value={values.phone}
            onChange={(event) => handleChange('phone', event.target.value)}
            placeholder="06 12 34 56 78"
          />
          <Input
            name="email"
            label="E-mail"
            type="email"
            value={values.email}
            onChange={(event) => handleChange('email', event.target.value)}
            placeholder="jean.dupont@exemple.fr"
          />
        </div>

        <Input
          name="address"
          label="Adresse"
          value={values.address}
          onChange={(event) => handleChange('address', event.target.value)}
          placeholder="12 rue de la Paix, 75002 Paris"
        />

        <Select
          name="status"
          label="Statut"
          value={values.status}
          onChange={(event) =>
            handleChange('status', event.target.value as ClientFormValues['status'])
          }
          options={statusOptions}
        />

        <Textarea
          name="notes"
          label="Notes"
          value={values.notes}
          onChange={(event) => handleChange('notes', event.target.value)}
          placeholder="Informations complémentaires…"
        />

        {client ? (
          <ClientPortalPanel clientId={client.id} clientEmail={values.email || client.email} />
        ) : null}
      </form>
    </Modal>
  )
}
