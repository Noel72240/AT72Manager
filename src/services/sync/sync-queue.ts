import type { EntityName, SyncAction, SyncQueueItem } from '@/types/entities'
import { getDb } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import { SYNC_ENGINE_CONFIG } from '@/services/sync/sync-engine.config'
import {
  computeNextRetryAt,
  hasExceededMaxRetries,
  isRetryDue,
} from '@/services/sync/sync-retry.service'

type EnqueueInput = {
  entity: EntityName
  action: SyncAction
  entityId: string
  payload: unknown
  localUpdatedAt?: string
}

function actionPriority(action: SyncAction): number {
  if (action === 'delete') return 3
  if (action === 'update') return 2
  return 1
}

export const syncQueue = {
  async enqueue(input: EnqueueInput): Promise<SyncQueueItem> {
    const db = await getDb()

    if (SYNC_ENGINE_CONFIG.coalesceQueue) {
      const pending = await this.getPending()
      const existing = pending.find(
        (item) => item.entity === input.entity && item.entityId === input.entityId,
      )
      if (existing) {
        const merged: SyncQueueItem = {
          ...existing,
          action:
            actionPriority(input.action) >= actionPriority(existing.action)
              ? input.action
              : existing.action,
          payload: input.payload,
          localUpdatedAt: input.localUpdatedAt ?? existing.localUpdatedAt,
          createdAt: new Date().toISOString(),
          status: 'pending',
        }
        await db.put(STORES.syncQueue, merged)
        return merged
      }
    }

    const item: SyncQueueItem = {
      id: crypto.randomUUID(),
      entity: input.entity,
      action: input.action,
      entityId: input.entityId,
      payload: input.payload,
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
      localUpdatedAt: input.localUpdatedAt,
    }

    await db.add(STORES.syncQueue, item)
    return item
  },

  async getAll(): Promise<SyncQueueItem[]> {
    const db = await getDb()
    return db.getAll(STORES.syncQueue)
  },

  async getPending(): Promise<SyncQueueItem[]> {
    const db = await getDb()
    const items = await db.getAllFromIndex(STORES.syncQueue, 'by-status', 'pending')
    return items.filter((item) => isRetryDue(item.nextRetryAt))
  },

  async getPendingCount(): Promise<number> {
    return (await this.getPending()).length
  },

  async getFailed(): Promise<SyncQueueItem[]> {
    const db = await getDb()
    return db.getAllFromIndex(STORES.syncQueue, 'by-status', 'failed')
  },

  async getFailedCount(): Promise<number> {
    return (await this.getFailed()).length
  },

  async getDeadLetterCount(): Promise<number> {
    const db = await getDb()
    const items = await db.getAllFromIndex(STORES.syncQueue, 'by-status', 'dead_letter')
    return items.length
  },

  async getProcessing(): Promise<SyncQueueItem[]> {
    const db = await getDb()
    return db.getAllFromIndex(STORES.syncQueue, 'by-status', 'processing')
  },

  async resetStuckProcessing(): Promise<number> {
    const db = await getDb()
    const stuck = await this.getProcessing()
    for (const item of stuck) {
      await db.put(STORES.syncQueue, { ...item, status: 'pending' })
    }
    return stuck.length
  },

  async requeueFailed(): Promise<number> {
    const db = await getDb()
    const failed = await this.getFailed()
    let requeued = 0

    for (const item of failed) {
      if (!isRetryDue(item.nextRetryAt)) continue

      if (hasExceededMaxRetries(item.retryCount)) {
        await db.put(STORES.syncQueue, { ...item, status: 'dead_letter' })
        continue
      }

      await db.put(STORES.syncQueue, {
        ...item,
        status: 'pending',
      })
      requeued += 1
    }

    return requeued
  },

  async markProcessing(id: string): Promise<void> {
    const db = await getDb()
    const item = await db.get(STORES.syncQueue, id)
    if (!item) return
    await db.put(STORES.syncQueue, { ...item, status: 'processing' })
  },

  async markFailed(id: string, error: string): Promise<void> {
    const db = await getDb()
    const item = await db.get(STORES.syncQueue, id)
    if (!item) return

    const retryCount = item.retryCount + 1
    const status = hasExceededMaxRetries(retryCount) ? 'dead_letter' : 'failed'

    await db.put(STORES.syncQueue, {
      ...item,
      status,
      retryCount,
      lastError: error,
      nextRetryAt: computeNextRetryAt(retryCount),
    })
  },

  async remove(id: string): Promise<void> {
    const db = await getDb()
    await db.delete(STORES.syncQueue, id)
  },

  async clearFailed(): Promise<void> {
    const db = await getDb()
    const failed = await this.getFailed()
    await Promise.all(failed.map((item) => db.delete(STORES.syncQueue, item.id)))
  },

  async clearDeadLetter(): Promise<void> {
    const db = await getDb()
    const dead = await db.getAllFromIndex(STORES.syncQueue, 'by-status', 'dead_letter')
    await Promise.all(dead.map((item) => db.delete(STORES.syncQueue, item.id)))
  },

  async clearAll(): Promise<void> {
    const db = await getDb()
    const all = await db.getAll(STORES.syncQueue)
    await Promise.all(all.map((item) => db.delete(STORES.syncQueue, item.id)))
  },

  async getFailureSummary(): Promise<{ count: number; hint: string | null; deadLetter: number }> {
    const failed = await this.getFailed()
    const deadLetter = await this.getDeadLetterCount()
    const total = failed.length + deadLetter
    if (total === 0) return { count: 0, hint: null, deadLetter: 0 }

    const byEntity = new Map<string, number>()
    for (const item of [...failed, ...(await this.getAll()).filter((i) => i.status === 'dead_letter')]) {
      byEntity.set(item.entity, (byEntity.get(item.entity) ?? 0) + 1)
    }

    const entities = [...byEntity.entries()]
      .map(([entity, count]) => `${entity} (${count})`)
      .join(', ')

    const firstHint = failed.find((item) => item.lastError)?.lastError ?? null
    const hint = firstHint
      ? `${entities} — ${firstHint.slice(0, 160)}`
      : entities

    return { count: total, hint, deadLetter }
  },
}
