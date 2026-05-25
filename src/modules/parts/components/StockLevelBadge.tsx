import type { StockLevel } from '@/types/entities'
import { Badge } from '@/components/ui/Badge'
import { STOCK_LEVEL_LABELS } from '@/modules/inventory/utils/stock-level'

const VARIANT: Record<StockLevel, 'success' | 'warning' | 'danger'> = {
  ok: 'success',
  low: 'warning',
  out: 'danger',
}

export function StockLevelBadge({ level }: { level: StockLevel }) {
  return <Badge variant={VARIANT[level]}>{STOCK_LEVEL_LABELS[level]}</Badge>
}
