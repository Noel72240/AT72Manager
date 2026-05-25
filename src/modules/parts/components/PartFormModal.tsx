import { useEffect, useState } from 'react'
import type { SparePart } from '@/types/entities'
import { EMPTY_PART_FORM, type PartFormValues } from '@/modules/parts/types/part-module.types'
import { PART_CATEGORIES } from '@/modules/inventory/utils/part-categories'
import { computePartMargin } from '@/modules/inventory/utils/margin'
import { formatPrice } from '@/modules/commercial/utils/format-price'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'

type PartFormModalProps = {
  open: boolean
  part?: SparePart | null
  saving?: boolean
  onClose: () => void
  onSubmit: (values: PartFormValues) => Promise<void>
}

function partToForm(part: SparePart): PartFormValues {
  return {
    name: part.name,
    category: part.category,
    reference: part.reference,
    supplier: part.supplier ?? '',
    purchasePrice: String(part.purchasePrice),
    salePrice: String(part.salePrice),
    quantity: String(part.quantity),
    minThreshold: String(part.minThreshold),
    notes: part.notes ?? '',
  }
}

export function PartFormModal({ open, part, saving = false, onClose, onSubmit }: PartFormModalProps) {
  const [values, setValues] = useState<PartFormValues>(EMPTY_PART_FORM)

  useEffect(() => {
    if (!open) return
    setValues(part ? partToForm(part) : EMPTY_PART_FORM)
  }, [open, part])

  const purchase = Number(values.purchasePrice) || 0
  const sale = Number(values.salePrice) || 0
  const { marginAmount, marginPercent } = computePartMargin(purchase, sale)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!values.name.trim() || !values.reference.trim()) return
    await onSubmit(values)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={part ? `Modifier ${part.name}` : 'Nouvelle pièce'}
      description="Catalogue pièces — scan code-barres & IA à venir"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" form="part-form" loading={saving}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="part-form" className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="name"
            label="Nom *"
            value={values.name}
            onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))}
            disabled={saving}
          />
          <Input
            name="reference"
            label="Référence *"
            value={values.reference}
            onChange={(e) => setValues((p) => ({ ...p, reference: e.target.value }))}
            disabled={saving}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            name="category"
            label="Catégorie"
            value={values.category}
            onChange={(e) => setValues((p) => ({ ...p, category: e.target.value }))}
            options={PART_CATEGORIES.map((c) => ({ value: c, label: c }))}
            disabled={saving}
          />
          <Input
            name="supplier"
            label="Fournisseur"
            value={values.supplier}
            onChange={(e) => setValues((p) => ({ ...p, supplier: e.target.value }))}
            disabled={saving}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="purchasePrice"
            label="Prix achat (€)"
            type="number"
            min={0}
            step={0.01}
            value={values.purchasePrice}
            onChange={(e) => setValues((p) => ({ ...p, purchasePrice: e.target.value }))}
            disabled={saving}
          />
          <Input
            name="salePrice"
            label="Prix vente (€)"
            type="number"
            min={0}
            step={0.01}
            value={values.salePrice}
            onChange={(e) => setValues((p) => ({ ...p, salePrice: e.target.value }))}
            disabled={saving}
          />
        </div>
        <div className="rounded-lg border border-border/70 bg-surface-hover/20 px-3 py-2 text-sm">
          Marge estimée : <span className="font-semibold text-neon-green">{formatPrice(marginAmount)}</span>
          <span className="text-text-muted"> ({marginPercent.toFixed(1)} %)</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="quantity"
            label="Quantité en stock"
            type="number"
            min={0}
            step={1}
            value={values.quantity}
            onChange={(e) => setValues((p) => ({ ...p, quantity: e.target.value }))}
            disabled={saving}
          />
          <Input
            name="minThreshold"
            label="Seuil minimum"
            type="number"
            min={0}
            step={1}
            value={values.minThreshold}
            onChange={(e) => setValues((p) => ({ ...p, minThreshold: e.target.value }))}
            disabled={saving}
          />
        </div>
        <Textarea
          name="notes"
          label="Notes"
          value={values.notes}
          onChange={(e) => setValues((p) => ({ ...p, notes: e.target.value }))}
          rows={2}
          disabled={saving}
        />
      </form>
    </Modal>
  )
}
