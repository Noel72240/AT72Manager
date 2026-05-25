import type { CommercialLine } from '@/types/entities'

export function parseLines(raw: unknown): CommercialLine[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      const id = typeof row.id === 'string' ? row.id : crypto.randomUUID()
      const kind = row.kind === 'part' || row.kind === 'labor' ? row.kind : 'labor'
      const partId =
        typeof row.partId === 'string'
          ? row.partId
          : typeof row.part_id === 'string'
            ? row.part_id
            : undefined
      const purchaseRaw = Number(row.purchaseUnitCost ?? row.purchase_unit_cost)
      const line: CommercialLine = {
        id,
        kind,
        description: String(row.description ?? ''),
        quantity: Number(row.quantity) || 0,
        unitPrice: Number(row.unitPrice ?? row.unit_price) || 0,
        vatRate: Number(row.vatRate ?? row.vat_rate) || 0,
      }
      if (partId) line.partId = partId
      if (Number.isFinite(purchaseRaw)) line.purchaseUnitCost = purchaseRaw
      return line
    })
    .filter((line): line is CommercialLine => line !== null)
}

export function serializeLines(lines: CommercialLine[]): unknown {
  return lines.map((line) => ({
    id: line.id,
    kind: line.kind,
    description: line.description,
    quantity: line.quantity,
    unit_price: line.unitPrice,
    vat_rate: line.vatRate,
    part_id: line.partId ?? null,
    purchase_unit_cost: line.purchaseUnitCost ?? null,
  }))
}
