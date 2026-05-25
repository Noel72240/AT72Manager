import type { SparePart, StockMovement } from '@/types/entities'
import { getStockLevel } from '@/modules/inventory/utils/stock-level'
import { computePartMargin } from '@/modules/inventory/utils/margin'
import { ROUTES } from '@/config/routes'

export type StockAlert = {
  id: string
  partId: string
  title: string
  description: string
  severity: 'warning' | 'danger'
}

export type StockDashboardMetrics = {
  totalParts: number
  totalUnits: number
  lowStockCount: number
  outOfStockCount: number
  inventoryValue: number
  potentialRevenue: number
  totalMargin: number
  movementsCount: number
  partsUsedOut: number
  alerts: StockAlert[]
  recentMovements: StockMovement[]
}

export function computeStockDashboardMetrics(
  parts: SparePart[],
  movements: StockMovement[],
): StockDashboardMetrics {
  const alerts: StockAlert[] = []
  let lowStockCount = 0
  let outOfStockCount = 0
  let inventoryValue = 0
  let potentialRevenue = 0
  let totalMargin = 0
  let totalUnits = 0

  for (const part of parts) {
    const level = getStockLevel(part)
    totalUnits += part.quantity
    inventoryValue += part.purchasePrice * part.quantity
    potentialRevenue += part.salePrice * part.quantity
    const { marginAmount } = computePartMargin(part.purchasePrice, part.salePrice)
    totalMargin += marginAmount * part.quantity

    if (level === 'low') {
      lowStockCount += 1
      alerts.push({
        id: `low-${part.id}`,
        partId: part.id,
        title: `Stock faible — ${part.name}`,
        description: `${part.quantity} restant(s), seuil ${part.minThreshold}`,
        severity: 'warning',
      })
    }
    if (level === 'out') {
      outOfStockCount += 1
      alerts.push({
        id: `out-${part.id}`,
        partId: part.id,
        title: `Rupture — ${part.name}`,
        description: `Réf. ${part.reference} — réapprovisionnement urgent`,
        severity: 'danger',
      })
    }
  }

  const partsUsedOut = movements.filter((m) => m.delta < 0).length
  const recentMovements = [...movements]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 15)

  return {
    totalParts: parts.length,
    totalUnits,
    lowStockCount,
    outOfStockCount,
    inventoryValue,
    potentialRevenue,
    totalMargin,
    movementsCount: movements.length,
    partsUsedOut,
    alerts: alerts.slice(0, 8),
    recentMovements,
  }
}

export const STOCK_DASHBOARD_LINK = ROUTES.STOCK
