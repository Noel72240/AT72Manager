import type { SyncQueueItem } from '@/types/entities'
import { getMeta, setMeta } from '@/services/indexeddb/db'

export type SyncConflictRecord = {
  id: string
  entity: SyncQueueItem['entity']
  entityId: string
  localUpdatedAt?: string
  remoteUpdatedAt?: string
  resolution: 'local_wins' | 'remote_wins' | 'pending'
  detectedAt: string
  message?: string
}

const META_CONFLICTS = 'sync_conflicts'

export const syncConflictService = {
  async list(): Promise<SyncConflictRecord[]> {
    return (await getMeta<SyncConflictRecord[]>(META_CONFLICTS)) ?? []
  },

  async register(conflict: Omit<SyncConflictRecord, 'id' | 'detectedAt' | 'resolution'>): Promise<void> {
    const list = await this.list()
    const record: SyncConflictRecord = {
      id: crypto.randomUUID(),
      detectedAt: new Date().toISOString(),
      resolution: 'pending',
      ...conflict,
    }
    await setMeta(META_CONFLICTS, [record, ...list].slice(0, 50))
  },

  async resolve(id: string, resolution: 'local_wins' | 'remote_wins'): Promise<void> {
    const list = await this.list()
    await setMeta(
      META_CONFLICTS,
      list.map((item) => (item.id === id ? { ...item, resolution } : item)),
    )
  },

  async pendingCount(): Promise<number> {
    const list = await this.list()
    return list.filter((item) => item.resolution === 'pending').length
  },
}

/** Compare les timestamps ISO — retourne true si conflit probable (remote plus récent que local). */
export function detectTimestampConflict(
  localUpdatedAt: string | undefined,
  remoteUpdatedAt: string | undefined,
): boolean {
  if (!localUpdatedAt || !remoteUpdatedAt) return false
  const local = new Date(localUpdatedAt).getTime()
  const remote = new Date(remoteUpdatedAt).getTime()
  return remote > local + 1_000
}

export function extractUpdatedAt(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined
  const row = payload as Record<string, unknown>
  const value = row.updated_at ?? row.updatedAt
  return typeof value === 'string' ? value : undefined
}
