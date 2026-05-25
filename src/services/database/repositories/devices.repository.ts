import type { Device, DeviceInsert, DeviceMedia, DeviceUpdate } from '@/types/entities'
import { normalizeDeviceCondition } from '@/modules/devices/utils/device-labels'
import { getDb } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import { databaseService } from '@/services/database/database.service'
import { syncService } from '@/services/sync/sync.service'

function parseMedia(value: unknown): Device['media'] | undefined {
  if (!value || typeof value !== 'object') return undefined
  return value as DeviceMedia
}

function mapRow(row: Record<string, unknown>): Device {
  const deviceType =
    (row.device_type as string | null) ||
    (row.name as string | null) ||
    'Autre'

  return {
    id: row.id as string,
    clientId: row.client_id as string,
    deviceType,
    brand: (row.brand as string | null) ?? undefined,
    model: (row.model as string | null) ?? undefined,
    serialNumber: (row.serial_number as string | null) ?? undefined,
    imei: (row.imei as string | null) ?? undefined,
    storageCapacity: (row.storage_capacity as string | null) ?? undefined,
    color: (row.color as string | null) ?? undefined,
    condition: normalizeDeviceCondition(
      (row.condition as string | null) ?? (row.status as string | null) ?? 'good',
    ),
    notes: (row.notes as string | null) ?? undefined,
    media: parseMedia(row.media),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    userId: row.user_id as string,
  }
}

function buildInsertRow(payload: DeviceInsert): Record<string, unknown> {
  return {
    client_id: payload.clientId,
    device_type: payload.deviceType,
    brand: payload.brand ?? null,
    model: payload.model ?? null,
    serial_number: payload.serialNumber ?? null,
    imei: payload.imei ?? null,
    storage_capacity: payload.storageCapacity ?? null,
    color: payload.color ?? null,
    condition: payload.condition,
    notes: payload.notes ?? null,
    name: payload.deviceType,
    status: payload.condition,
    user_id: payload.userId,
  }
}

function mapToRow(payload: DeviceInsert | DeviceUpdate): Record<string, unknown> {
  const row: Record<string, unknown> = {}

  if ('clientId' in payload && payload.clientId !== undefined) row.client_id = payload.clientId
  if ('deviceType' in payload && payload.deviceType !== undefined) {
    row.device_type = payload.deviceType
    row.name = payload.deviceType
  }
  if ('brand' in payload && payload.brand !== undefined) row.brand = payload.brand || null
  if ('model' in payload && payload.model !== undefined) row.model = payload.model || null
  if ('serialNumber' in payload && payload.serialNumber !== undefined) {
    row.serial_number = payload.serialNumber || null
  }
  if ('imei' in payload && payload.imei !== undefined) row.imei = payload.imei || null
  if ('storageCapacity' in payload && payload.storageCapacity !== undefined) {
    row.storage_capacity = payload.storageCapacity || null
  }
  if ('color' in payload && payload.color !== undefined) row.color = payload.color || null
  if ('condition' in payload && payload.condition !== undefined) {
    row.condition = payload.condition
    row.status = payload.condition
  }
  if ('notes' in payload && payload.notes !== undefined) row.notes = payload.notes || null
  if ('userId' in payload && payload.userId !== undefined) row.user_id = payload.userId

  return row
}

export const devicesRepository = {
  async listLocal(): Promise<Device[]> {
    const db = await getDb()
    return db.getAll(STORES.devices)
  },

  async getLocal(id: string): Promise<Device | undefined> {
    const db = await getDb()
    return db.get(STORES.devices, id)
  },

  async upsertLocal(device: Device): Promise<void> {
    const db = await getDb()
    await db.put(STORES.devices, device)
  },

  async removeLocal(id: string): Promise<void> {
    const db = await getDb()
    await db.delete(STORES.devices, id)
  },

  async list(): Promise<Device[]> {
    if (!databaseService.isAvailable()) {
      return this.listLocal()
    }

    const rows = await databaseService.list('devices')
    const items = rows.map((row) => mapRow(row as Record<string, unknown>))
    await Promise.all(items.map((item) => this.upsertLocal(item)))
    return items
  },

  async getById(id: string): Promise<Device | null> {
    const local = await this.getLocal(id)
    if (!databaseService.isAvailable()) {
      return local ?? null
    }

    try {
      const data = await databaseService.getById('devices', id)
      const mapped = mapRow(data as Record<string, unknown>)
      await this.upsertLocal(mapped)
      return mapped
    } catch {
      return local ?? null
    }
  },

  async create(payload: DeviceInsert): Promise<Device> {
    const now = new Date().toISOString()
    const localItem: Device = {
      id: crypto.randomUUID(),
      ...payload,
      createdAt: now,
      updatedAt: now,
    }
    const row = { id: localItem.id, ...buildInsertRow(payload) }

    await this.upsertLocal(localItem)

    if (!databaseService.isAvailable()) {
      await syncService.enqueue({
        entity: 'devices',
        action: 'create',
        entityId: localItem.id,
        payload: row,
      })
      return localItem
    }

    const created = await databaseService.insert('devices', row)
    const mapped = mapRow(created as Record<string, unknown>)
    await this.upsertLocal(mapped)
    return mapped
  },

  async update(id: string, payload: DeviceUpdate): Promise<Device> {
    const existing = (await this.getLocal(id)) ?? (await this.getById(id))
    if (!existing) {
      throw new Error('Appareil introuvable.')
    }

    const row = mapToRow(payload)
    const now = new Date().toISOString()
    row.updated_at = now

    const updated: Device = {
      ...existing,
      ...payload,
      updatedAt: now,
    }

    await this.upsertLocal(updated)

    if (!databaseService.isAvailable()) {
      await syncService.enqueue({
        entity: 'devices',
        action: 'update',
        entityId: id,
        payload: row,
      })
      return updated
    }

    const result = await databaseService.update('devices', id, row)
    const mapped = mapRow(result as Record<string, unknown>)
    await this.upsertLocal(mapped)
    return mapped
  },

  async remove(id: string): Promise<void> {
    await this.removeLocal(id)

    if (!databaseService.isAvailable()) {
      await syncService.enqueue({
        entity: 'devices',
        action: 'delete',
        entityId: id,
        payload: { id },
      })
      return
    }

    await databaseService.remove('devices', id)
  },
}
