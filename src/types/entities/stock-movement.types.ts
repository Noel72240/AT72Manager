export type StockMovementType =
  | 'in'
  | 'out'
  | 'adjustment'
  | 'intervention'
  | 'quote'
  | 'invoice'
  | 'manual'

export type StockReferenceType =
  | 'intervention'
  | 'quote'
  | 'invoice'
  | 'manual'
  | 'part'

export type StockMovement = {
  id: string
  partId: string
  movementType: StockMovementType
  /** Variation signée (+ entrée, − sortie) */
  delta: number
  quantityAfter: number
  referenceType?: StockReferenceType
  referenceId?: string
  notes?: string
  createdAt: string
  userId: string
}

export type StockMovementInsert = Omit<StockMovement, 'id' | 'createdAt'>
