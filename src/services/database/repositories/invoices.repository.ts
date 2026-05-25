import type { Invoice, InvoiceInsert, InvoiceUpdate, Quote } from '@/types/entities'
import { getDb } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import { databaseService } from '@/services/database/database.service'
import { syncService } from '@/services/sync/sync.service'
import { allocateDocumentNumber } from '@/modules/commercial/services/document-number.service'
import { parseLines, serializeLines } from '@/services/database/repositories/commercial-map'
import { withWorkshopId } from '@/services/database/workshop-context'

function mapRow(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    number: row.number as string,
    clientId: row.client_id as string,
    interventionId: (row.intervention_id as string | null) ?? undefined,
    deviceId: (row.device_id as string | null) ?? undefined,
    quoteId: (row.quote_id as string | null) ?? undefined,
    status: row.status as Invoice['status'],
    title: (row.title as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    lines: parseLines(row.lines),
    subtotal: Number(row.subtotal) || 0,
    vatTotal: Number(row.vat_total) || 0,
    total: Number(row.total) || 0,
    dueDate: (row.due_date as string | null) ?? undefined,
    paidAt: (row.paid_at as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    userId: row.user_id as string,
  }
}

function buildInsertRow(payload: InvoiceInsert): Record<string, unknown> {
  return {
    number: payload.number,
    client_id: payload.clientId,
    intervention_id: payload.interventionId ?? null,
    device_id: payload.deviceId ?? null,
    quote_id: payload.quoteId ?? null,
    status: payload.status,
    title: payload.title ?? null,
    notes: payload.notes ?? null,
    lines: serializeLines(payload.lines),
    subtotal: payload.subtotal,
    vat_total: payload.vatTotal,
    total: payload.total,
    due_date: payload.dueDate ?? null,
    paid_at: payload.paidAt ?? null,
    user_id: payload.userId,
  }
}

function mapToRow(payload: InvoiceUpdate): Record<string, unknown> {
  const row: Record<string, unknown> = {}

  if (payload.clientId !== undefined) row.client_id = payload.clientId
  if (payload.interventionId !== undefined) row.intervention_id = payload.interventionId || null
  if (payload.deviceId !== undefined) row.device_id = payload.deviceId || null
  if (payload.quoteId !== undefined) row.quote_id = payload.quoteId || null
  if (payload.status !== undefined) row.status = payload.status
  if (payload.title !== undefined) row.title = payload.title || null
  if (payload.notes !== undefined) row.notes = payload.notes || null
  if (payload.lines !== undefined) row.lines = serializeLines(payload.lines)
  if (payload.subtotal !== undefined) row.subtotal = payload.subtotal
  if (payload.vatTotal !== undefined) row.vat_total = payload.vatTotal
  if (payload.total !== undefined) row.total = payload.total
  if (payload.dueDate !== undefined) row.due_date = payload.dueDate || null
  if (payload.paidAt !== undefined) row.paid_at = payload.paidAt || null

  return row
}

export const invoicesRepository = {
  async listLocal(): Promise<Invoice[]> {
    const db = await getDb()
    return db.getAll(STORES.invoices)
  },

  async getLocal(id: string): Promise<Invoice | undefined> {
    const db = await getDb()
    return db.get(STORES.invoices, id)
  },

  async upsertLocal(invoice: Invoice): Promise<void> {
    const db = await getDb()
    await db.put(STORES.invoices, invoice)
  },

  async removeLocal(id: string): Promise<void> {
    const db = await getDb()
    await db.delete(STORES.invoices, id)
  },

  async list(): Promise<Invoice[]> {
    if (!databaseService.isAvailable()) {
      return this.listLocal()
    }

    try {
      const rows = await databaseService.list('invoices')
      const invoices = rows.map((row) => mapRow(row as Record<string, unknown>))
      await Promise.all(invoices.map((invoice) => this.upsertLocal(invoice)))
      return invoices
    } catch {
      return this.listLocal()
    }
  },

  async getById(id: string): Promise<Invoice | null> {
    const local = await this.getLocal(id)
    if (!databaseService.isAvailable()) {
      return local ?? null
    }

    try {
      const data = await databaseService.getById('invoices', id)
      const mapped = mapRow(data as Record<string, unknown>)
      await this.upsertLocal(mapped)
      return mapped
    } catch {
      return local ?? null
    }
  },

  async create(payload: Omit<InvoiceInsert, 'number'> & { number?: string }): Promise<Invoice> {
    const now = new Date().toISOString()
    const number = payload.number ?? (await allocateDocumentNumber('invoice'))
    const localInvoice: Invoice = {
      id: crypto.randomUUID(),
      ...payload,
      number,
      createdAt: now,
      updatedAt: now,
    }
    const row = withWorkshopId({
      id: localInvoice.id,
      ...buildInsertRow({ ...payload, number }),
    })

    await this.upsertLocal(localInvoice)

    if (!databaseService.isAvailable()) {
      await syncService.enqueue({
        entity: 'invoices',
        action: 'create',
        entityId: localInvoice.id,
        payload: row,
      })
      return localInvoice
    }

    try {
      const created = await databaseService.insert('invoices', row)
      const mapped = mapRow(created as Record<string, unknown>)
      await this.upsertLocal(mapped)
      return mapped
    } catch {
      await syncService.enqueue({
        entity: 'invoices',
        action: 'create',
        entityId: localInvoice.id,
        payload: row,
      })
      return localInvoice
    }
  },

  async createFromQuote(quote: Quote, userId: string): Promise<Invoice> {
    const due = new Date()
    due.setDate(due.getDate() + 30)

    return this.create({
      userId,
      clientId: quote.clientId,
      interventionId: quote.interventionId,
      deviceId: quote.deviceId,
      quoteId: quote.id,
      status: 'draft',
      title: quote.title ? `Facture — ${quote.title}` : `Facture ${quote.number}`,
      notes: quote.notes,
      lines: quote.lines.map((line) => ({ ...line, id: crypto.randomUUID() })),
      subtotal: quote.subtotal,
      vatTotal: quote.vatTotal,
      total: quote.total,
      dueDate: due.toISOString().slice(0, 10),
    })
  },

  async update(id: string, payload: InvoiceUpdate): Promise<Invoice> {
    const existing = (await this.getLocal(id)) ?? (await this.getById(id))
    if (!existing) {
      throw new Error('Facture introuvable.')
    }

    const row = mapToRow(payload)
    const now = new Date().toISOString()
    row.updated_at = now

    if (payload.status === 'paid' && !payload.paidAt) {
      row.paid_at = now
    }

    const updated: Invoice = {
      ...existing,
      ...payload,
      paidAt:
        payload.status === 'paid'
          ? payload.paidAt ?? now
          : payload.paidAt !== undefined
            ? payload.paidAt
            : existing.paidAt,
      updatedAt: now,
    }

    await this.upsertLocal(updated)

    if (!databaseService.isAvailable()) {
      await syncService.enqueue({
        entity: 'invoices',
        action: 'update',
        entityId: id,
        payload: row,
      })
      return updated
    }

    try {
      const result = await databaseService.update('invoices', id, row)
      const mapped = mapRow(result as Record<string, unknown>)
      await this.upsertLocal(mapped)
      return mapped
    } catch {
      await syncService.enqueue({
        entity: 'invoices',
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
        entity: 'invoices',
        action: 'delete',
        entityId: id,
        payload: { id },
      })
      return
    }

    try {
      await databaseService.remove('invoices', id)
    } catch {
      await syncService.enqueue({
        entity: 'invoices',
        action: 'delete',
        entityId: id,
        payload: { id },
      })
    }
  },
}
