import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { sessionRecoveryService } from '@/services/session/session-recovery.service'
import { idbHealthService } from '@/services/indexeddb/idb-health.service'

/** Reprise session + maintenance IDB légère au démarrage. */
export function useSessionRecovery(): void {
  const location = useLocation()

  useEffect(() => {
    void idbHealthService.pruneStaleQueue()
    void idbHealthService.pruneActivityFeedCache()
  }, [])

  useEffect(() => {
    void sessionRecoveryService.save({ lastRoute: location.pathname })
  }, [location.pathname])
}

export async function restoreLastRoute(): Promise<string | null> {
  const snapshot = await sessionRecoveryService.load()
  return snapshot?.lastRoute ?? null
}
