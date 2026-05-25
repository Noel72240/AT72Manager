import { env } from '@/config/env'
import { getMeta, setMeta } from '@/services/indexeddb/db'
import { syncQueue } from '@/services/sync/sync-queue'
import { databaseService } from '@/services/database/database.service'
import {
  getSyncErrorMessage,
  isDuplicateKeyError,
  isMissingSchemaError,
  isNotFoundError,
} from '@/services/sync/sync-errors'
import {
  detectTimestampConflict,
  extractUpdatedAt,
  syncConflictService,
} from '@/services/sync/sync-conflict.service'
import { syncLogger } from '@/services/sync/sync-logger.service'
import type { TableName } from '@/services/supabase/types'

export type SyncResult = {
  ok: boolean
  syncedAt: string
  processed: number
  failed: number
  requeued: number
  deadLetter: number
  errorHint?: string
  silent?: boolean
}

const LAST_SYNC_KEY = 'last_sync_at'

async function fetchRemoteUpdatedAt(
  table: TableName,
  entityId: string,
): Promise<string | undefined> {
  try {
    const row = await databaseService.getById(table, entityId)
    if (!row || typeof row !== 'object') return undefined
    const updated = (row as Record<string, unknown>).updated_at
    return typeof updated === 'string' ? updated : undefined
  } catch {
    return undefined
  }
}

export const syncService = {
  async getLastSyncAt(): Promise<string | null> {
    const value = await getMeta<string>(LAST_SYNC_KEY)
    return value ?? null
  },

  async getPendingCount(): Promise<number> {
    return syncQueue.getPendingCount()
  },

  async getFailedCount(): Promise<number> {
    return syncQueue.getFailedCount()
  },

  async getFailureSummary(): Promise<{ count: number; hint: string | null; deadLetter: number }> {
    return syncQueue.getFailureSummary()
  },

  async enqueue(
    ...args: Parameters<typeof syncQueue.enqueue>
  ): Promise<ReturnType<typeof syncQueue.enqueue>> {
    return syncQueue.enqueue(...args)
  },

  async processQueue(options: { silent?: boolean } = {}): Promise<SyncResult> {
    const syncedAt = new Date().toISOString()

    if (!navigator.onLine || !env.isSupabaseConfigured) {
      return { ok: false, syncedAt, processed: 0, failed: 0, requeued: 0, deadLetter: 0, silent: options.silent }
    }

    const stuck = await syncQueue.resetStuckProcessing()
    if (stuck > 0) {
      await syncLogger.append('warn', `${stuck} opération(s) sync récupérée(s) après interruption`)
    }

    const requeued = await syncQueue.requeueFailed()
    if (requeued > 0 && !options.silent) {
      await syncLogger.append('info', `${requeued} échec(s) remis en file avec backoff`)
    }

    const pending = await syncQueue.getPending()
    let processed = 0
    let failed = 0
    let lastErrorHint: string | undefined

    for (const item of pending) {
      await syncQueue.markProcessing(item.id)

      try {
        await this.applyQueueItem(item)
        await syncQueue.remove(item.id)
        processed += 1
      } catch (error) {
        const message = getSyncErrorMessage(error)
        await syncQueue.markFailed(item.id, message)
        failed += 1
        await syncLogger.append('error', `Sync ${item.entity}/${item.entityId}`, {
          detail: message,
          entity: item.entity,
          entityId: item.entityId,
        })
        if (!lastErrorHint && isMissingSchemaError(error)) {
          lastErrorHint = message
        }
      }
    }

    if (processed > 0) {
      await setMeta(LAST_SYNC_KEY, syncedAt)
      if (!options.silent) {
        await syncLogger.append('success', `${processed} modification(s) synchronisée(s)`)
      }
    }

    const summary = await syncQueue.getFailureSummary()

    return {
      ok: failed === 0 && summary.count === 0,
      syncedAt,
      processed,
      failed,
      requeued,
      deadLetter: summary.deadLetter,
      errorHint: lastErrorHint ?? summary.hint ?? undefined,
      silent: options.silent,
    }
  },

  async applyQueueItem(item: Awaited<ReturnType<typeof syncQueue.getPending>>[number]) {
    const table = item.entity as TableName
    const payload = item.payload as Record<string, unknown>

    if (item.action === 'update' || item.action === 'create') {
      const localUpdated = item.localUpdatedAt ?? extractUpdatedAt(payload)
      const remoteUpdated = await fetchRemoteUpdatedAt(table, item.entityId)
      if (detectTimestampConflict(localUpdated, remoteUpdated)) {
        await syncConflictService.register({
          entity: item.entity,
          entityId: item.entityId,
          localUpdatedAt: localUpdated,
          remoteUpdatedAt: remoteUpdated,
          message: 'Version cloud plus récente — fusion locale appliquée (last-write-wins sortant)',
        })
      }
    }

    switch (item.action) {
      case 'create':
        await this.applyCreate(table, item.entityId, payload)
        break
      case 'update':
        await this.applyUpdate(table, item.entityId, payload)
        break
      case 'delete':
        await this.applyDelete(table, item.entityId)
        break
      default:
        throw new Error(`Action de synchronisation inconnue: ${item.action}`)
    }
  },

  async applyCreate(table: TableName, entityId: string, payload: Record<string, unknown>) {
    try {
      await databaseService.insert(table, payload)
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        await databaseService.update(table, entityId, payload)
        return
      }
      throw error
    }
  },

  async applyUpdate(table: TableName, entityId: string, payload: Record<string, unknown>) {
    try {
      await databaseService.update(table, entityId, payload)
    } catch (error) {
      if (isNotFoundError(error)) {
        await databaseService.insert(table, { id: entityId, ...payload })
        return
      }
      throw error
    }
  },

  async applyDelete(table: TableName, entityId: string) {
    try {
      await databaseService.remove(table, entityId)
    } catch (error) {
      if (isNotFoundError(error)) return
      throw error
    }
  },

  async run(options?: { silent?: boolean }): Promise<SyncResult> {
    return this.processQueue(options)
  },

  async clearFailedQueue(): Promise<void> {
    await syncQueue.clearFailed()
    await syncQueue.clearDeadLetter()
    await syncLogger.append('info', 'File sync nettoyée manuellement')
  },
}
