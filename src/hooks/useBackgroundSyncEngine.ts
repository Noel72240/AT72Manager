import { useEffect } from 'react'
import { useSyncStore } from '@/store/sync.store'
import { SYNC_ENGINE_CONFIG } from '@/services/sync/sync-engine.config'

/** Sync cloud silencieuse — démarre après le boot splash. */
export function useBackgroundSyncEngine(startupDone: boolean): void {
  const sync = useSyncStore((s) => s.sync)
  const isSyncing = useSyncStore((s) => s.isSyncing)
  const isOnline = useSyncStore((s) => s.isOnline)

  useEffect(() => {
    if (!startupDone) return

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && isOnline && !isSyncing && navigator.onLine) {
        void sync({ silent: SYNC_ENGINE_CONFIG.silentSync })
      }
    }, SYNC_ENGINE_CONFIG.backgroundIntervalMs)

    return () => clearInterval(timer)
  }, [startupDone, sync, isSyncing, isOnline])
}
