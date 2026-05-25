import type { Client, ClientInsert, ClientUpdate } from '@/types/entities'
import { getDb } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import { databaseService } from '@/services/database/database.service'
import { syncService } from '@/services/sync/sync.service'
import {
  joinClientName,
  splitClientName,
} from '@/modules/clients/utils/client-name'

function mapRow(row: Record<string, unknown>): Client {
  const { firstName, lastName } = splitClientName((row.name as string) ?? '')

  return {
    id: row.id as string,
    firstName,
    lastName,
    email: (row.email as string | null) ?? undefined,
    phone: (row.phone as string | null) ?? undefined,
    address: (row.address as string | null) ?? undefined,
    status: row.status as Client['status'],
    notes: (row.notes as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    userId: row.user_id as string,
  }
}

function mapToRow(payload: ClientInsert | ClientUpdate): Record<string, unknown> {
  const row: Record<string, unknown> = {}

  if ('firstName' in payload || 'lastName' in payload) {
    const firstName = 'firstName' in payload ? payload.firstName : undefined
    const lastName = 'lastName' in payload ? payload.lastName : undefined
    if (firstName !== undefined || lastName !== undefined) {
      row.name = joinClientName(firstName ?? '', lastName ?? '')
    }
  }

  if ('email' in payload && payload.email !== undefined) row.email = payload.email || null
  if ('phone' in payload && payload.phone !== undefined) row.phone = payload.phone || null
  if ('address' in payload && payload.address !== undefined) row.address = payload.address || null
  if ('status' in payload && payload.status !== undefined) row.status = payload.status
  if ('notes' in payload && payload.notes !== undefined) row.notes = payload.notes || null
  if ('userId' in payload && payload.userId !== undefined) row.user_id = payload.userId

  return row
}

function buildInsertRow(payload: ClientInsert): Record<string, unknown> {
  return {
    name: joinClientName(payload.firstName, payload.lastName),
    email: payload.email ?? null,
    phone: payload.phone ?? null,
    address: payload.address ?? null,
    status: payload.status,
    notes: payload.notes ?? null,
    user_id: payload.userId,
  }
}

export const clientsRepository = {
  async listLocal(): Promise<Client[]> {
    const db = await getDb()
    return db.getAll(STORES.clients)
  },

  async getLocal(id: string): Promise<Client | undefined> {
    const db = await getDb()
    return db.get(STORES.clients, id)
  },

  async upsertLocal(client: Client): Promise<void> {
    const db = await getDb()
    await db.put(STORES.clients, client)
  },

  async removeLocal(id: string): Promise<void> {
    const db = await getDb()
    await db.delete(STORES.clients, id)
  },

  async list(): Promise<Client[]> {
    if (!databaseService.isAvailable()) {
      return this.listLocal()
    }

    const rows = await databaseService.list('clients')
    const clients = rows.map((row) => mapRow(row as Record<string, unknown>))
    await Promise.all(clients.map((client) => this.upsertLocal(client)))
    return clients
  },

  async getById(id: string): Promise<Client | null> {
    const local = await this.getLocal(id)
    if (!databaseService.isAvailable()) {
      return local ?? null
    }

    try {
      const data = await databaseService.getById('clients', id)
      const mapped = mapRow(data as Record<string, unknown>)
      await this.upsertLocal(mapped)
      return mapped
    } catch {
      return local ?? null
    }
  },

  async create(payload: ClientInsert): Promise<Client> {
    const now = new Date().toISOString()
    const localClient: Client = {
      id: crypto.randomUUID(),
      ...payload,
      createdAt: now,
      updatedAt: now,
    }
    const row = { id: localClient.id, ...buildInsertRow(payload) }

    await this.upsertLocal(localClient)

    if (!databaseService.isAvailable()) {
      await syncService.enqueue({
        entity: 'clients',
        action: 'create',
        entityId: localClient.id,
        payload: row,
      })
      return localClient
    }

    const created = await databaseService.insert('clients', row)
    const mapped = mapRow(created as Record<string, unknown>)
    await this.upsertLocal(mapped)
    return mapped
  },

  async update(id: string, payload: ClientUpdate): Promise<Client> {
    const existing = (await this.getLocal(id)) ?? (await this.getById(id))
    if (!existing) {
      throw new Error('Client introuvable.')
    }

    const row = mapToRow(payload)
    const now = new Date().toISOString()
    row.updated_at = now
    const updated: Client = {
      ...existing,
      ...payload,
      updatedAt: now,
    }

    await this.upsertLocal(updated)

    if (!databaseService.isAvailable()) {
      await syncService.enqueue({
        entity: 'clients',
        action: 'update',
        entityId: id,
        payload: row,
      })
      return updated
    }

    const result = await databaseService.update('clients', id, row)
    const mapped = mapRow(result as Record<string, unknown>)
    await this.upsertLocal(mapped)
    return mapped
  },

  async remove(id: string): Promise<void> {
    await this.removeLocal(id)

    if (!databaseService.isAvailable()) {
      await syncService.enqueue({
        entity: 'clients',
        action: 'delete',
        entityId: id,
        payload: { id },
      })
      return
    }

    await databaseService.remove('clients', id)
  },
}
