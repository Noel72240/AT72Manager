import { syncService } from '@/services/sync/sync.service'

export type OfflineMode = 'online' | 'offline' | 'degraded'

export type OfflineStatus = {
  mode: OfflineMode
  lastSyncAt: string | null
  pendingCount: number
  failedCount: number
  syncErrorHint: string | null
}

export const offlineService = {
  getMode(): OfflineMode {
    if (!navigator.onLine) return 'offline'
    return 'online'
  },

  async getStatus(): Promise<OfflineStatus> {
    const [lastSyncAt, pendingCount, failedCount, failureSummary] = await Promise.all([
      syncService.getLastSyncAt(),
      syncService.getPendingCount(),
      syncService.getFailedCount(),
      syncService.getFailureSummary(),
    ])

    const backlog = pendingCount + failedCount
    const mode: OfflineMode =
      !navigator.onLine ? 'offline' : backlog > 0 ? 'degraded' : 'online'

    return {
      mode,
      lastSyncAt,
      pendingCount,
      failedCount,
      syncErrorHint: failureSummary.hint,
    }
  },
}
