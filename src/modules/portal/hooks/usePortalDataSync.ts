import { useEffect } from 'react'
import { usePortalAuthStore } from '@/store/portal-auth.store'
import { usePortalDataStore } from '@/store/portal-data.store'

export function usePortalDataSync() {
  const session = usePortalAuthStore((s) => s.session)
  const status = usePortalAuthStore((s) => s.status)
  const refresh = usePortalDataStore((s) => s.refresh)

  useEffect(() => {
    if (status !== 'authenticated' || !session?.clientId) return
    void refresh(session.clientId)
  }, [status, session?.clientId, refresh])

  useEffect(() => {
    function onOnline() {
      if (session?.clientId) void refresh(session.clientId)
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [session?.clientId, refresh])
}
