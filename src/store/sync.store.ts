import { create } from 'zustand'
import { syncService } from '@/services/sync/sync.service'
import { offlineService } from '@/services/offline/offline.service'
import type { OfflineMode } from '@/services/offline/offline.service'
import { useAuthStore } from '@/store/auth.store'
import { emitFeedItem } from '@/features/notifications/services/feed.service'
import { ROUTES } from '@/config/routes'
import { SYNC_ENGINE_CONFIG } from '@/services/sync/sync-engine.config'
import { nativeNotificationsService } from '@/services/desktop/native-notifications.service'

type SyncStore = {
  isOnline: boolean
  mode: OfflineMode
  pendingCount: number
  failedCount: number
  deadLetterCount: number
  syncErrorHint: string | null
  lastSyncAt: string | null
  isSyncing: boolean
  initialize: () => void
  refresh: () => Promise<void>
  sync: (options?: { silent?: boolean }) => Promise<void>
  clearFailed: () => Promise<void>
}

let syncInitialized = false

export const useSyncStore = create<SyncStore>((set, get) => ({
  isOnline: navigator.onLine,
  mode: 'online',
  pendingCount: 0,
  failedCount: 0,
  deadLetterCount: 0,
  syncErrorHint: null,
  lastSyncAt: null,
  isSyncing: false,

  initialize: () => {
    if (syncInitialized) return
    syncInitialized = true

    const handleOnline = () => {
      set({ isOnline: true })
      void get().refresh()
      void get().sync({ silent: true })
    }

    const handleOffline = () => {
      set({ isOnline: false })
      void get().refresh()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    void get().refresh()
    if (navigator.onLine) {
      void get().sync({ silent: true })
    }
  },

  refresh: async () => {
    const status = await offlineService.getStatus()
    const summary = await syncService.getFailureSummary()
    set({
      mode: status.mode,
      pendingCount: status.pendingCount,
      failedCount: status.failedCount,
      deadLetterCount: summary.deadLetter,
      syncErrorHint: status.syncErrorHint,
      lastSyncAt: status.lastSyncAt,
      isOnline: navigator.onLine,
    })
  },

  sync: async (options = {}) => {
    if (get().isSyncing || !navigator.onLine) return

    set({ isSyncing: true })
    try {
      const silent = options.silent ?? false
      const result = await syncService.run({ silent })
      const userId = useAuthStore.getState().user?.id

      if (userId && !silent) {
        if (result.failed > 0 || result.errorHint || result.deadLetter > 0) {
          await emitFeedItem(
            userId,
            {
              kind: 'sync_error',
              title: 'Synchronisation partielle',
              message:
                result.errorHint ??
                `${result.failed} échec(s) · ${result.deadLetter} dead-letter`,
              href: ROUTES.DASHBOARD,
              dedupeKey: `sync_error_run:${result.failed}:${result.deadLetter}`,
            },
            { toast: true, toastVariant: 'warning' },
          )
          void nativeNotificationsService.notify({
            title: 'AT72Manager — Sync',
            body: result.errorHint ?? 'Synchronisation partielle',
          })
        } else if (result.processed > 0) {
          await emitFeedItem(
            userId,
            {
              kind: 'sync_success',
              title: 'Sauvegarde cloud',
              message: `${result.processed} modification(s) synchronisée(s)`,
              dedupeKey: `sync_success_run:${result.syncedAt}`,
            },
            { toast: true, toastVariant: 'success' },
          )
        }
      }

      await get().refresh()
    } finally {
      set({ isSyncing: false })
    }
  },

  clearFailed: async () => {
    await syncService.clearFailedQueue()
    await get().refresh()
  },
}))

export { SYNC_ENGINE_CONFIG }
