import { getDb } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import type { SecurityLogEntry, SecurityLogInsert } from '@/types/audit.types'
import { getDeviceLabel } from '@/utils/device'
import { databaseService } from '@/services/database/database.service'
import { env } from '@/config/env'

function mapRow(row: Record<string, unknown>): SecurityLogEntry {
  return {
    id: row.id as string,
    workshopId: (row.workshop_id as string | null) ?? undefined,
    userId: (row.user_id as string | null) ?? undefined,
    eventType: row.event_type as SecurityLogEntry['eventType'],
    severity: row.severity as SecurityLogEntry['severity'],
    message: row.message as string,
    deviceLabel: (row.device_label as string | null) ?? undefined,
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
    createdAt: row.created_at as string,
    syncedAt: (row.synced_at as string | null) ?? undefined,
  }
}

function mapToRow(entry: SecurityLogEntry | SecurityLogInsert & { id?: string; createdAt?: string }): Record<string, unknown> {
  return {
    id: entry.id,
    workshop_id: entry.workshopId ?? null,
    user_id: entry.userId ?? null,
    event_type: entry.eventType,
    severity: entry.severity,
    message: entry.message,
    device_label: entry.deviceLabel ?? null,
    metadata: entry.metadata ?? null,
    created_at: entry.createdAt,
  }
}

export const securityLogsRepository = {
  async listLocal(workshopId?: string): Promise<SecurityLogEntry[]> {
    const db = await getDb()
    const all = await db.getAll(STORES.securityLogs)
    const sorted = all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (!workshopId) return sorted
    return sorted.filter((item) => !item.workshopId || item.workshopId === workshopId)
  },

  async upsertLocal(entry: SecurityLogEntry): Promise<void> {
    const db = await getDb()
    await db.put(STORES.securityLogs, entry)
  },

  async list(workshopId: string, limit = 80): Promise<SecurityLogEntry[]> {
    if (!databaseService.isAvailable()) {
      return (await this.listLocal(workshopId)).slice(0, limit)
    }

    try {
      const { data, error } = await databaseService
        .from('security_logs' as never)
        .select('*')
        .eq('workshop_id' as never, workshopId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      const entries = (data ?? []).map((row) => mapRow(row as Record<string, unknown>))
      await Promise.all(entries.map((entry) => this.upsertLocal(entry)))
      return entries
    } catch {
      return (await this.listLocal(workshopId)).slice(0, limit)
    }
  },

  async create(entry: SecurityLogInsert): Promise<SecurityLogEntry> {
    const local: SecurityLogEntry = {
      id: crypto.randomUUID(),
      ...entry,
      deviceLabel: entry.deviceLabel ?? getDeviceLabel(),
      createdAt: new Date().toISOString(),
    }

    await this.upsertLocal(local)

    if (env.isSupabaseConfigured && navigator.onLine) {
      try {
        await databaseService.insert('security_logs' as never, mapToRow(local))
        local.syncedAt = new Date().toISOString()
        await this.upsertLocal(local)
      } catch (error) {
        console.warn('[security] sync différée:', error)
      }
    }

    return local
  },
}
