import type { CommercialLine, DocumentTotals } from '@/types/entities'
import { DEFAULT_VAT_RATE } from '@/types/entities'

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function computeLineSubtotal(line: CommercialLine): number {
  const qty = Number.isFinite(line.quantity) ? line.quantity : 0
  const price = Number.isFinite(line.unitPrice) ? line.unitPrice : 0
  return roundMoney(qty * price)
}

export function computeDocumentTotals(
  lines: CommercialLine[],
  defaultVatRate = DEFAULT_VAT_RATE,
): DocumentTotals {
  let subtotal = 0
  let vatTotal = 0

  for (const line of lines) {
    const lineSub = computeLineSubtotal(line)
    subtotal += lineSub
    const rate = Number.isFinite(line.vatRate) ? line.vatRate : defaultVatRate
    vatTotal += lineSub * (rate / 100)
  }

  subtotal = roundMoney(subtotal)
  vatTotal = roundMoney(vatTotal)

  return {
    subtotal,
    vatTotal,
    total: roundMoney(subtotal + vatTotal),
  }
}

export function createEmptyLine(kind: CommercialLine['kind'] = 'labor'): CommercialLine {
  return {
    id: crypto.randomUUID(),
    kind,
    description: '',
    quantity: 1,
    unitPrice: 0,
    vatRate: DEFAULT_VAT_RATE,
  }
}
