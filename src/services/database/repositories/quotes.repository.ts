import type { Quote, QuoteInsert, QuoteUpdate } from '@/types/entities'
import { getDb } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import { databaseService } from '@/services/database/database.service'
import { syncService } from '@/services/sync/sync.service'
import { allocateDocumentNumber } from '@/modules/commercial/services/document-number.service'
import { parseLines, serializeLines } from '@/services/database/repositories/commercial-map'
import { withWorkshopId } from '@/services/database/workshop-context'

function mapRow(row: Record<string, unknown>): Quote {
  return {
    id: row.id as string,
    number: row.number as string,
    clientId: row.client_id as string,
    interventionId: (row.intervention_id as string | null) ?? undefined,
    deviceId: (row.device_id as string | null) ?? undefined,
    status: row.status as Quote['status'],
    title: (row.title as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    lines: parseLines(row.lines),
    subtotal: Number(row.subtotal) || 0,
    vatTotal: Number(row.vat_total) || 0,
    total: Number(row.total) || 0,
    validUntil: (row.valid_until as string | null) ?? undefined,
    convertedInvoiceId: (row.converted_invoice_id as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    userId: row.user_id as string,
  }
}

function buildInsertRow(payload: QuoteInsert): Record<string, unknown> {
  return {
    number: payload.number,
    client_id: payload.clientId,
    intervention_id: payload.interventionId ?? null,
    device_id: payload.deviceId ?? null,
    status: payload.status,
    title: payload.title ?? null,
    notes: payload.notes ?? null,
    lines: serializeLines(payload.lines),
    subtotal: payload.subtotal,
    vat_total: payload.vatTotal,
    total: payload.total,
    valid_until: payload.validUntil ?? null,
    converted_invoice_id: payload.convertedInvoiceId ?? null,
    user_id: payload.userId,
  }
}

function mapToRow(payload: QuoteUpdate): Record<string, unknown> {
  const row: Record<string, unknown> = {}

  if (payload.clientId !== undefined) row.client_id = payload.clientId
  if (payload.interventionId !== undefined) row.intervention_id = payload.interventionId || null
  if (payload.deviceId !== undefined) row.device_id = payload.deviceId || null
  if (payload.status !== undefined) row.status = payload.status
  if (payload.title !== undefined) row.title = payload.title || null
  if (payload.notes !== undefined) row.notes = payload.notes || null
  if (payload.lines !== undefined) row.lines = serializeLines(payload.lines)
  if (payload.subtotal !== undefined) row.subtotal = payload.subtotal
  if (payload.vatTotal !== undefined) row.vat_total = payload.vatTotal
  if (payload.total !== undefined) row.total = payload.total
  if (payload.validUntil !== undefined) row.valid_until = payload.validUntil || null
  if (payload.convertedInvoiceId !== undefined) {
    row.converted_invoice_id = payload.convertedInvoiceId || null
  }

  return row
}

export const quotesRepository = {
  async listLocal(): Promise<Quote[]> {
    const db = await getDb()
    return db.getAll(STORES.quotes)
  },

  async getLocal(id: string): Promise<Quote | undefined> {
    const db = await getDb()
    return db.get(STORES.quotes, id)
  },

  async upsertLocal(quote: Quote): Promise<void> {
    const db = await getDb()
    await db.put(STORES.quotes, quote)
  },

  async removeLocal(id: string): Promise<void> {
    const db = await getDb()
    await db.delete(STORES.quotes, id)
  },

  async list(): Promise<Quote[]> {
    if (!databaseService.isAvailable()) {
      return this.listLocal()
    }

    try {
      const rows = await databaseService.list('quotes')
      const quotes = rows.map((row) => mapRow(row as Record<string, unknown>))
      await Promise.all(quotes.map((quote) => this.upsertLocal(quote)))
      return quotes
    } catch {
      return this.listLocal()
    }
  },

  async getById(id: string): Promise<Quote | null> {
    const local = await this.getLocal(id)
    if (!databaseService.isAvailable()) {
      return local ?? null
    }

    try {
      const data = await databaseService.getById('quotes', id)
      const mapped = mapRow(data as Record<string, unknown>)
      await this.upsertLocal(mapped)
      return mapped
    } catch {
      return local ?? null
    }
  },

  async create(payload: Omit<QuoteInsert, 'number'> & { number?: string }): Promise<Quote> {
    const now = new Date().toISOString()
    const number = payload.number ?? (await allocateDocumentNumber('quote'))
    const localQuote: Quote = {
      id: crypto.randomUUID(),
      ...payload,
      number,
      createdAt: now,
      updatedAt: now,
    }
    const row = withWorkshopId({
      id: localQuote.id,
      ...buildInsertRow({ ...payload, number }),
    })

    await this.upsertLocal(localQuote)

    if (!databaseService.isAvailable()) {
      await syncService.enqueue({
        entity: 'quotes',
        action: 'create',
        entityId: localQuote.id,
        payload: row,
      })
      return localQuote
    }

    try {
      const created = await databaseService.insert('quotes', row)
      const mapped = mapRow(created as Record<string, unknown>)
      await this.upsertLocal(mapped)
      return mapped
    } catch {
      await syncService.enqueue({
        entity: 'quotes',
        action: 'create',
        entityId: localQuote.id,
        payload: row,
      })
      return localQuote
    }
  },

  async update(id: string, payload: QuoteUpdate): Promise<Quote> {
    const existing = (await this.getLocal(id)) ?? (await this.getById(id))
    if (!existing) {
      throw new Error('Devis introuvable.')
    }

    const row = mapToRow(payload)
    const now = new Date().toISOString()
    row.updated_at = now
    const updated: Quote = {
      ...existing,
      ...payload,
      updatedAt: now,
    }

    await this.upsertLocal(updated)

    if (!databaseService.isAvailable()) {
      await syncService.enqueue({
        entity: 'quotes',
        action: 'update',
        entityId: id,
        payload: row,
      })
      return updated
    }

    try {
      const result = await databaseService.update('quotes', id, row)
      const mapped = mapRow(result as Record<string, unknown>)
      await this.upsertLocal(mapped)
      return mapped
    } catch {
      await syncService.enqueue({
        entity: 'quotes',
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
        entity: 'quotes',
        action: 'delete',
        entityId: id,
        payload: { id },
      })
      return
    }

    try {
      await databaseService.remove('quotes', id)
    } catch {
      await syncService.enqueue({
        entity: 'quotes',
        action: 'delete',
        entityId: id,
        payload: { id },
      })
    }
  },
}
