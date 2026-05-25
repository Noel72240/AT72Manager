import type { SparePart, SparePartInsert, SparePartUpdate } from '@/types/entities'
import { getDb } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import { databaseService } from '@/services/database/database.service'
import { syncService } from '@/services/sync/sync.service'

function mapRow(row: Record<string, unknown>): SparePart {
  return {
    id: row.id as string,
    name: row.name as string,
    category: (row.category as string) || 'Autre',
    reference: row.reference as string,
    supplier: (row.supplier as string | null) ?? undefined,
    purchasePrice: Number(row.purchase_price) || 0,
    salePrice: Number(row.sale_price) || 0,
    quantity: Number(row.quantity) || 0,
    minThreshold: Number(row.min_threshold) || 0,
    notes: (row.notes as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    userId: row.user_id as string,
  }
}

function buildInsertRow(payload: SparePartInsert): Record<string, unknown> {
  return {
    name: payload.name,
    category: payload.category,
    reference: payload.reference,
    supplier: payload.supplier ?? null,
    purchase_price: payload.purchasePrice,
    sale_price: payload.salePrice,
    quantity: payload.quantity,
    min_threshold: payload.minThreshold,
    notes: payload.notes ?? null,
    user_id: payload.userId,
  }
}

function mapToRow(payload: SparePartUpdate): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (payload.name !== undefined) row.name = payload.name
  if (payload.category !== undefined) row.category = payload.category
  if (payload.reference !== undefined) row.reference = payload.reference
  if (payload.supplier !== undefined) row.supplier = payload.supplier || null
  if (payload.purchasePrice !== undefined) row.purchase_price = payload.purchasePrice
  if (payload.salePrice !== undefined) row.sale_price = payload.salePrice
  if (payload.quantity !== undefined) row.quantity = payload.quantity
  if (payload.minThreshold !== undefined) row.min_threshold = payload.minThreshold
  if (payload.notes !== undefined) row.notes = payload.notes || null
  return row
}

export const sparePartsRepository = {
  async listLocal(): Promise<SparePart[]> {
    const db = await getDb()
    return db.getAll(STORES.spareParts)
  },

  async getLocal(id: string): Promise<SparePart | undefined> {
    const db = await getDb()
    return db.get(STORES.spareParts, id)
  },

  async upsertLocal(part: SparePart): Promise<void> {
    const db = await getDb()
    await db.put(STORES.spareParts, part)
  },

  async removeLocal(id: string): Promise<void> {
    const db = await getDb()
    await db.delete(STORES.spareParts, id)
  },

  async list(): Promise<SparePart[]> {
    if (!databaseService.isAvailable()) {
      return this.listLocal()
    }
    try {
      const rows = await databaseService.list('spare_parts')
      const parts = rows.map((row) => mapRow(row as Record<string, unknown>))
      await Promise.all(parts.map((part) => this.upsertLocal(part)))
      return parts
    } catch {
      return this.listLocal()
    }
  },

  async getById(id: string): Promise<SparePart | null> {
    const local = await this.getLocal(id)
    if (!databaseService.isAvailable()) {
      return local ?? null
    }
    try {
      const data = await databaseService.getById('spare_parts', id)
      const mapped = mapRow(data as Record<string, unknown>)
      await this.upsertLocal(mapped)
      return mapped
    } catch {
      return local ?? null
    }
  },

  async create(payload: SparePartInsert): Promise<SparePart> {
    const now = new Date().toISOString()
    const localPart: SparePart = {
      id: crypto.randomUUID(),
      ...payload,
      createdAt: now,
      updatedAt: now,
    }
    const row = { id: localPart.id, ...buildInsertRow(payload) }
    await this.upsertLocal(localPart)

    if (!databaseService.isAvailable()) {
      await syncService.enqueue({
        entity: 'spare_parts',
        action: 'create',
        entityId: localPart.id,
        payload: row,
      })
      return localPart
    }

    try {
      const created = await databaseService.insert('spare_parts', row)
      const mapped = mapRow(created as Record<string, unknown>)
      await this.upsertLocal(mapped)
      return mapped
    } catch {
      await syncService.enqueue({
        entity: 'spare_parts',
        action: 'create',
        entityId: localPart.id,
        payload: row,
      })
      return localPart
    }
  },

  async update(id: string, payload: SparePartUpdate): Promise<SparePart> {
    const existing = (await this.getLocal(id)) ?? (await this.getById(id))
    if (!existing) throw new Error('Pièce introuvable.')

    const row = mapToRow(payload)
    const now = new Date().toISOString()
    row.updated_at = now
    const updated: SparePart = { ...existing, ...payload, updatedAt: now }
    await this.upsertLocal(updated)

    if (!databaseService.isAvailable()) {
      await syncService.enqueue({
        entity: 'spare_parts',
        action: 'update',
        entityId: id,
        payload: row,
      })
      return updated
    }

    try {
      const result = await databaseService.update('spare_parts', id, row)
      const mapped = mapRow(result as Record<string, unknown>)
      await this.upsertLocal(mapped)
      return mapped
    } catch {
      await syncService.enqueue({
        entity: 'spare_parts',
        action: 'update',
        entityId: id,
        payload: row,
      })
      return updated
    }
  },

  async remove(id: string): Promise<void> {
    await this.removeLocal(id)
    if (!databaseService.isAvailable()) {
      await syncService.enqueue({
        entity: 'spare_parts',
        action: 'delete',
        entityId: id,
        payload: { id },
      })
      return
    }
    try {
      await databaseService.remove('spare_parts', id)
    } catch {
      await syncService.enqueue({
        entity: 'spare_parts',
        action: 'delete',
        entityId: id,
        payload: { id },
      })
    }
  },
}
