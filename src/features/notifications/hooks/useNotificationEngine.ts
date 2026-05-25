import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useFeedStore } from '@/store/feed.store'
import { runNotificationEngine } from '@/features/notifications/services/notification-engine'

const SCAN_INTERVAL_MS = 5 * 60 * 1000

export function useNotificationEngine() {
  const userId = useAuthStore((state) => state.user?.id)
  const load = useFeedStore((state) => state.load)
  const scanRef = useRef(false)

  useEffect(() => {
    if (!userId) return
    void load()
  }, [userId, load])

  useEffect(() => {
    if (!userId) return

    const run = async () => {
      if (scanRef.current) return
      scanRef.current = true
      try {
        await runNotificationEngine(userId)
        await load()
      } catch (error) {
        console.error('[notifications] scan failed:', error)
      } finally {
        scanRef.current = false
      }
    }

    void run()
    const interval = window.setInterval(() => void run(), SCAN_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [userId, load])
}
