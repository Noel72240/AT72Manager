import type { StockMovement, StockMovementInsert } from '@/types/entities'
import { getDb } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import { databaseService } from '@/services/database/database.service'
import { syncService } from '@/services/sync/sync.service'

function mapRow(row: Record<string, unknown>): StockMovement {
  return {
    id: row.id as string,
    partId: row.part_id as string,
    movementType: row.movement_type as StockMovement['movementType'],
    delta: Number(row.delta) || 0,
    quantityAfter: Number(row.quantity_after) || 0,
    referenceType: (row.reference_type as StockMovement['referenceType']) ?? undefined,
    referenceId: (row.reference_id as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    createdAt: row.created_at as string,
    userId: row.user_id as string,
  }
}

function buildInsertRow(payload: StockMovementInsert): Record<string, unknown> {
  return {
    part_id: payload.partId,
    movement_type: payload.movementType,
    delta: payload.delta,
    quantity_after: payload.quantityAfter,
    reference_type: payload.referenceType ?? null,
    reference_id: payload.referenceId ?? null,
    notes: payload.notes ?? null,
    user_id: payload.userId,
  }
}

export const stockMovementsRepository = {
  async listLocal(): Promise<StockMovement[]> {
    const db = await getDb()
    return db.getAll(STORES.stockMovements)
  },

  async listByPartLocal(partId: string): Promise<StockMovement[]> {
    const db = await getDb()
    return db.getAllFromIndex(STORES.stockMovements, 'by-part', partId)
  },

  async upsertLocal(movement: StockMovement): Promise<void> {
    const db = await getDb()
    await db.put(STORES.stockMovements, movement)
  },

  async list(): Promise<StockMovement[]> {
    if (!databaseService.isAvailable()) {
      return this.listLocal()
    }
    try {
      const rows = await databaseService.list('stock_movements')
      const movements = rows.map((row) => mapRow(row as Record<string, unknown>))
      await Promise.all(movements.map((movement) => this.upsertLocal(movement)))
      return movements.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    } catch {
      return this.listLocal()
    }
  },

  async create(payload: StockMovementInsert): Promise<StockMovement> {
    const movement: StockMovement = {
      id: crypto.randomUUID(),
      ...payload,
      createdAt: new Date().toISOString(),
    }
    const row = { id: movement.id, ...buildInsertRow(payload) }
    await this.upsertLocal(movement)

    if (!databaseService.isAvailable()) {
      await syncService.enqueue({
        entity: 'stock_movements',
        action: 'create',
        entityId: movement.id,
        payload: row,
      })
      return movement
    }

    try {
      const created = await databaseService.insert('stock_movements', row)
      const mapped = mapRow(created as Record<string, unknown>)
      await this.upsertLocal(mapped)
      return mapped
    } catch {
      await syncService.enqueue({
        entity: 'stock_movements',
        action: 'create',
        entityId: movement.id,
        payload: row,
      })
      return movement
    }
  },
}
