import { Plus, Trash2 } from 'lucide-react'
import type { CommercialLine, CommercialLineKind, SparePart } from '@/types/entities'
import { LINE_KIND_LABELS } from '@/types/entities'
import { computeLineSubtotal } from '@/modules/commercial/utils/document-totals'
import { formatPrice } from '@/modules/commercial/utils/format-price'
import { createEmptyLine } from '@/modules/commercial/utils/document-totals'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

type LineItemsEditorProps = {
  lines: CommercialLine[]
  onChange: (lines: CommercialLine[]) => void
  disabled?: boolean
  catalogParts?: SparePart[]
}

const kindOptions = [
  { value: 'part' as const, label: LINE_KIND_LABELS.part },
  { value: 'labor' as const, label: LINE_KIND_LABELS.labor },
]

function updateLine(
  lines: CommercialLine[],
  id: string,
  patch: Partial<CommercialLine>,
): CommercialLine[] {
  return lines.map((line) => (line.id === id ? { ...line, ...patch } : line))
}

function applyPartToLine(line: CommercialLine, part: SparePart): CommercialLine {
  return {
    ...line,
    kind: 'part',
    partId: part.id,
    description: part.name,
    unitPrice: part.salePrice,
    purchaseUnitCost: part.purchasePrice,
  }
}

export function LineItemsEditor({
  lines,
  onChange,
  disabled = false,
  catalogParts = [],
}: LineItemsEditorProps) {
  const addLine = (kind: CommercialLineKind = 'labor') => {
    onChange([...lines, createEmptyLine(kind)])
  }

  const removeLine = (id: string) => {
    onChange(lines.filter((line) => line.id !== id))
  }

  const patchLine = (id: string, patch: Partial<CommercialLine>) => {
    onChange(updateLine(lines, id, patch))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-text-primary">Lignes</h4>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="size-3.5" />}
            onClick={() => addLine('part')}
            disabled={disabled}
          >
            Pièce
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="size-3.5" />}
            onClick={() => addLine('labor')}
            disabled={disabled}
          >
            Main d&apos;œuvre
          </Button>
        </div>
      </div>

      {lines.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/80 px-3 py-4 text-center text-sm text-text-muted">
          Ajoutez au moins une ligne (pièce ou main d&apos;œuvre).
        </p>
      ) : (
        <div className="space-y-3">
          {lines.map((line, index) => (
            <div
              key={line.id}
              className="rounded-xl border border-border/70 bg-surface-hover/15 p-3 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-text-muted">Ligne {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Supprimer la ligne"
                  onClick={() => removeLine(line.id)}
                  disabled={disabled}
                >
                  <Trash2 className="size-4 text-danger" />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  name={`kind-${line.id}`}
                  label="Type"
                  value={line.kind}
                  onChange={(event) =>
                    patchLine(line.id, { kind: event.target.value as CommercialLineKind })
                  }
                  options={kindOptions}
                  disabled={disabled}
                />
                {line.kind === 'part' && catalogParts.length > 0 ? (
                  <Select
                    name={`part-${line.id}`}
                    label="Pièce catalogue"
                    value={line.partId ?? ''}
                    onChange={(event) => {
                      const part = catalogParts.find((p) => p.id === event.target.value)
                      if (part) patchLine(line.id, applyPartToLine(line, part))
                    }}
                    options={[
                      { value: '', label: '— Manuel —' },
                      ...catalogParts.map((p) => ({
                        value: p.id,
                        label: `${p.reference} — ${p.name} (${p.quantity} en stock)`,
                      })),
                    ]}
                    disabled={disabled}
                  />
                ) : null}
                <Input
                  name={`description-${line.id}`}
                  label="Description"
                  value={line.description}
                  onChange={(event) => patchLine(line.id, { description: event.target.value })}
                  placeholder="Ex. Écran LCD iPhone 14"
                  disabled={disabled}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <Input
                  name={`qty-${line.id}`}
                  label="Qté"
                  type="number"
                  min={0}
                  step={1}
                  value={String(line.quantity)}
                  onChange={(event) =>
                    patchLine(line.id, { quantity: Number(event.target.value) || 0 })
                  }
                  disabled={disabled}
                />
                <Input
                  name={`unit-${line.id}`}
                  label="Prix unitaire (€)"
                  type="number"
                  min={0}
                  step={0.01}
                  value={String(line.unitPrice)}
                  onChange={(event) =>
                    patchLine(line.id, { unitPrice: Number(event.target.value) || 0 })
                  }
                  disabled={disabled}
                />
                <Input
                  name={`vat-${line.id}`}
                  label="TVA (%)"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={String(line.vatRate)}
                  onChange={(event) =>
                    patchLine(line.id, { vatRate: Number(event.target.value) || 0 })
                  }
                  disabled={disabled}
                />
                <div className="flex flex-col justify-end">
                  <span className="text-xs text-text-muted">Total ligne</span>
                  <span className="text-sm font-semibold text-neon-blue">
                    {formatPrice(computeLineSubtotal(line))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
