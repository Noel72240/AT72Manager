import { useEffect } from 'react'
import { ensureSupabaseClient } from '@/services/supabase/client'
import { usePortalAuthStore } from '@/store/portal-auth.store'

const PORTAL_AUTH_TIMEOUT_MS = 10_000

export function usePortalAuthInit() {
  const initialize = usePortalAuthStore((s) => s.initialize)

  useEffect(() => {
    const failSafe = window.setTimeout(() => {
      if (!usePortalAuthStore.getState().initialized) {
        console.warn('[portal-auth] timeout — affichage login/register')
        usePortalAuthStore.setState({
          status: 'unauthenticated',
          session: null,
          initialized: true,
        })
      }
    }, PORTAL_AUTH_TIMEOUT_MS)

    void ensureSupabaseClient()
      .then(() => initialize())
      .catch((error) => {
        console.error('[portal-auth] init:', error)
        usePortalAuthStore.setState({
          status: 'unauthenticated',
          session: null,
          initialized: true,
        })
      })
      .finally(() => window.clearTimeout(failSafe))

    return () => window.clearTimeout(failSafe)
  }, [initialize])
}
