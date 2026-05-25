import type { SparePart, StockLevel } from '@/types/entities'

export const STOCK_LEVEL_LABELS: Record<StockLevel, string> = {
  ok: 'Stock OK',
  low: 'Stock faible',
  out: 'Rupture',
}

export function getStockLevel(
  part: Pick<SparePart, 'quantity' | 'minThreshold'>,
): StockLevel {
  if (part.quantity <= 0) return 'out'
  if (part.minThreshold > 0 && part.quantity <= part.minThreshold) return 'low'
  return 'ok'
}
