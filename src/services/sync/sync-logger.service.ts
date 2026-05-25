import { getMeta, setMeta } from '@/services/indexeddb/db'
import {
  SYNC_ENGINE_CONFIG,
  type SyncLogEntry,
  type SyncLogLevel,
} from '@/services/sync/sync-engine.config'

const META_SYNC_LOGS = 'sync_engine_logs'

export const syncLogger = {
  async getLogs(): Promise<SyncLogEntry[]> {
    return (await getMeta<SyncLogEntry[]>(META_SYNC_LOGS)) ?? []
  },

  async append(
    level: SyncLogLevel,
    message: string,
    extra?: Pick<SyncLogEntry, 'detail' | 'entity' | 'entityId'>,
  ): Promise<void> {
    const logs = await this.getLogs()
    const entry: SyncLogEntry = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      level,
      message,
      ...extra,
    }
    const next = [entry, ...logs].slice(0, SYNC_ENGINE_CONFIG.logMaxEntries)
    await setMeta(META_SYNC_LOGS, next)

    const prefix = `[sync:${level}]`
    if (level === 'error') console.error(prefix, message, extra?.detail ?? '')
    else if (level === 'warn') console.warn(prefix, message)
    else console.info(prefix, message)
  },

  async clear(): Promise<void> {
    await setMeta(META_SYNC_LOGS, [])
  },
}
