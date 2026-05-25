import { useEffect } from 'react'
import { sessionService } from '@/services/auth/session.service'
import { useAuthStore } from '@/store/auth.store'

const HEARTBEAT_MS = 60_000

/** Maintient la session active (multi-PC, last_seen) */
export function useSessionHeartbeat() {
  const userId = useAuthStore((state) => state.user?.id)

  useEffect(() => {
    if (!userId) return

    void sessionService.touch(userId)
    const timer = window.setInterval(() => {
      void sessionService.touch(userId)
    }, HEARTBEAT_MS)

    return () => window.clearInterval(timer)
  }, [userId])
}
