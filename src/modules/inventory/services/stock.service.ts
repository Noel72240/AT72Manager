import type { CommercialLine } from '@/types/entities'
import type { StockMovementType, StockReferenceType } from '@/types/entities'
import { sparePartsRepository } from '@/services/database/repositories/spare-parts.repository'
import { stockMovementsRepository } from '@/services/database/repositories/stock-movements.repository'

export function aggregatePartUsage(lines: CommercialLine[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const line of lines) {
    if (line.kind !== 'part' || !line.partId) continue
    map.set(line.partId, (map.get(line.partId) ?? 0) + line.quantity)
  }
  return map
}

type StockRef = {
  referenceType: StockReferenceType
  referenceId: string
  movementType: StockMovementType
}

export async function applyStockDelta(
  partId: string,
  delta: number,
  userId: string,
  ref: StockRef,
  notes?: string,
) {
  const part =
    (await sparePartsRepository.getLocal(partId)) ??
    (await sparePartsRepository.getById(partId))
  if (!part) throw new Error('Pièce introuvable.')

  const newQty = part.quantity + delta
  if (newQty < 0) {
    throw new Error(`Stock insuffisant pour « ${part.name} » (${part.quantity} dispo).`)
  }

  await sparePartsRepository.update(partId, { quantity: newQty })
  await stockMovementsRepository.create({
    partId,
    delta,
    quantityAfter: newQty,
    movementType: ref.movementType,
    referenceType: ref.referenceType,
    referenceId: ref.referenceId,
    notes,
    userId,
  })
}

/** Ajuste le stock selon la différence d'utilisation entre deux jeux de lignes */
export async function syncStockFromLines(
  previousLines: CommercialLine[],
  nextLines: CommercialLine[],
  userId: string,
  ref: StockRef,
  shouldDeduct: boolean,
) {
  if (!shouldDeduct) return

  const prevMap = aggregatePartUsage(previousLines)
  const nextMap = aggregatePartUsage(nextLines)
  const partIds = new Set([...prevMap.keys(), ...nextMap.keys()])

  for (const partId of partIds) {
    const prevQty = prevMap.get(partId) ?? 0
    const nextQty = nextMap.get(partId) ?? 0
    const usageDiff = nextQty - prevQty
    if (usageDiff === 0) continue
    const delta = -usageDiff
    await applyStockDelta(
      partId,
      delta,
      userId,
      ref,
      usageDiff > 0 ? 'Sortie stock (utilisation)' : 'Réintégration stock',
    )
  }
}

export async function handleDocumentStockTransition(
  previousLines: CommercialLine[],
  nextLines: CommercialLine[],
  wasDeducting: boolean,
  isDeducting: boolean,
  userId: string,
  ref: StockRef,
) {
  if (wasDeducting && !isDeducting) {
    await syncStockFromLines(previousLines, [], userId, ref, true)
    return
  }
  if (!wasDeducting && isDeducting) {
    await syncStockFromLines([], nextLines, userId, ref, true)
    return
  }
  if (wasDeducting && isDeducting) {
    await syncStockFromLines(previousLines, nextLines, userId, ref, true)
  }
}

export async function manualStockAdjustment(
  partId: string,
  delta: number,
  userId: string,
  notes?: string,
) {
  await applyStockDelta(partId, delta, userId, {
    referenceType: 'manual',
    referenceId: partId,
    movementType: delta >= 0 ? 'in' : 'out',
  }, notes ?? (delta >= 0 ? 'Entrée manuelle' : 'Sortie manuelle'))
}
