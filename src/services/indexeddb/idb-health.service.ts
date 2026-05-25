import { getDb, getLastDbInitResult } from '@/services/indexeddb/db'
import { DB_VERSION, STORES } from '@/services/indexeddb/schema'
import { syncQueue } from '@/services/sync/sync-queue'

export type IdbHealthReport = {
  version: number
  status: string
  storeCount: number
  queuePending: number
  queueFailed: number
  queueDeadLetter: number
  healthy: boolean
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export const idbHealthService = {
  async getReport(): Promise<IdbHealthReport> {
    const db = await getDb()
    const init = getLastDbInitResult()
    const [queuePending, queueFailed, queueDeadLetter] = await Promise.all([
      syncQueue.getPendingCount(),
      syncQueue.getFailedCount(),
      syncQueue.getDeadLetterCount(),
    ])

    const storeCount = db.objectStoreNames.length
    const expected = Object.values(STORES).length

    return {
      version: DB_VERSION,
      status: init?.status ?? 'unknown',
      storeCount,
      queuePending,
      queueFailed,
      queueDeadLetter,
      healthy: storeCount >= expected && init?.status !== 'degraded',
    }
  },

  /** Purge les entrées sync dead-letter > 30 jours (nettoyage intelligent). */
  async pruneStaleQueue(): Promise<number> {
    const all = await syncQueue.getAll()
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    let removed = 0
    for (const item of all) {
      if (
        item.status === 'dead_letter' &&
        new Date(item.createdAt).getTime() < cutoff
      ) {
        await syncQueue.remove(item.id)
        removed += 1
      }
    }
    return removed
  },

  async pruneActivityFeedCache(maxAgeMs = CACHE_TTL_MS): Promise<number> {
    const db = await getDb()
    const items = await db.getAll(STORES.activityFeed)
    const cutoff = Date.now() - maxAgeMs
    let removed = 0
    for (const item of items) {
      if (new Date(item.createdAt).getTime() < cutoff) {
        await db.delete(STORES.activityFeed, item.id)
        removed += 1
      }
    }
    return removed
  },
}
