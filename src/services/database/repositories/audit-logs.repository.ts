import { getDb } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import type { AuditLogEntry, AuditLogInsert } from '@/types/audit.types'
import { getDeviceLabel } from '@/utils/device'
import { databaseService } from '@/services/database/database.service'
import { env } from '@/config/env'

function mapRow(row: Record<string, unknown>): AuditLogEntry {
  return {
    id: row.id as string,
    workshopId: row.workshop_id as string,
    actorId: row.actor_id as string,
    actorName: (row.actor_name as string) ?? 'Utilisateur',
    action: row.action as AuditLogEntry['action'],
    resource: row.resource as AuditLogEntry['resource'],
    resourceId: (row.resource_id as string | null) ?? undefined,
    summary: row.summary as string,
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
    deviceLabel: (row.device_label as string | null) ?? undefined,
    createdAt: row.created_at as string,
    syncedAt: (row.synced_at as string | null) ?? undefined,
  }
}

function mapToRow(entry: AuditLogEntry | AuditLogInsert & { id?: string; createdAt?: string }): Record<string, unknown> {
  return {
    id: entry.id,
    workshop_id: entry.workshopId,
    actor_id: entry.actorId,
    actor_name: entry.actorName,
    action: entry.action,
    resource: entry.resource,
    resource_id: entry.resourceId ?? null,
    summary: entry.summary,
    metadata: entry.metadata ?? null,
    device_label: entry.deviceLabel ?? null,
    created_at: entry.createdAt,
  }
}

export const auditLogsRepository = {
  async listLocal(workshopId?: string): Promise<AuditLogEntry[]> {
    const db = await getDb()
    const all = await db.getAll(STORES.auditLogs)
    const sorted = all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (!workshopId) return sorted
    return sorted.filter((item) => item.workshopId === workshopId)
  },

  async upsertLocal(entry: AuditLogEntry): Promise<void> {
    const db = await getDb()
    await db.put(STORES.auditLogs, entry)
  },

  async list(workshopId: string, limit = 100): Promise<AuditLogEntry[]> {
    if (!databaseService.isAvailable()) {
      return (await this.listLocal(workshopId)).slice(0, limit)
    }

    try {
      const { data, error } = await databaseService
        .from('audit_logs' as never)
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

  async create(entry: AuditLogInsert): Promise<AuditLogEntry> {
    const local: AuditLogEntry = {
      id: crypto.randomUUID(),
      ...entry,
      deviceLabel: entry.deviceLabel ?? getDeviceLabel(),
      createdAt: new Date().toISOString(),
    }

    await this.upsertLocal(local)

    if (env.isSupabaseConfigured && navigator.onLine) {
      try {
        await databaseService.insert('audit_logs' as never, mapToRow(local))
        local.syncedAt = new Date().toISOString()
        await this.upsertLocal(local)
      } catch (error) {
        console.warn('[audit] sync différée:', error)
      }
    }

    return local
  },
}
