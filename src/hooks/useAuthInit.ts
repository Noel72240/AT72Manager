import { useEffect } from 'react'
import { ensureSupabaseClient } from '@/services/supabase/client'
import { useAuthStore } from '@/store/auth.store'

const AUTH_BOOT_TIMEOUT_MS = 14_000

export function useAuthInit() {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    const failSafe = window.setTimeout(() => {
      if (!useAuthStore.getState().initialized) {
        console.warn('[auth] timeout démarrage — accès page de connexion')
        useAuthStore.setState({
          status: 'unauthenticated',
          user: null,
          session: null,
          initialized: true,
        })
      }
    }, AUTH_BOOT_TIMEOUT_MS)

    void ensureSupabaseClient()
      .then(() => initialize())
      .catch((error) => {
        console.error('[auth] ensureSupabaseClient:', error)
        useAuthStore.setState({
          status: 'unauthenticated',
          user: null,
          session: null,
          initialized: true,
        })
      })
      .finally(() => window.clearTimeout(failSafe))

    return () => window.clearTimeout(failSafe)
  }, [initialize])
}
