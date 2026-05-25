import type { CommercialLine } from '@/types/entities'
import { roundMoney } from '@/modules/commercial/utils/document-totals'

export function computePartMargin(purchasePrice: number, salePrice: number) {
  const marginAmount = roundMoney(salePrice - purchasePrice)
  const marginPercent =
    salePrice > 0 ? roundMoney((marginAmount / salePrice) * 100) : 0
  return { marginAmount, marginPercent }
}

export function computeLinesCost(lines: CommercialLine[]): number {
  return roundMoney(
    lines.reduce((sum, line) => {
      if (line.kind !== 'part') return sum
      const unitCost = line.purchaseUnitCost ?? 0
      return sum + unitCost * line.quantity
    }, 0),
  )
}

export function computeLinesProfit(lines: CommercialLine[]): number {
  return roundMoney(
    lines.reduce((sum, line) => {
      if (line.kind !== 'part') return sum
      const unitCost = line.purchaseUnitCost ?? 0
      return sum + (line.unitPrice - unitCost) * line.quantity
    }, 0),
  )
}

export function computeInterventionCost(
  partsLines: CommercialLine[],
  laborLines: CommercialLine[] = [],
): number {
  return roundMoney(computeLinesCost(partsLines) + computeLinesCost(laborLines))
}
