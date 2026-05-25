import { useEffect, useRef } from 'react'
import { useGoogleCalendarStore } from '@/store/google-calendar.store'

export function useGoogleCalendarSyncEngine(): void {
  const settings = useGoogleCalendarStore((s) => s.settings)
  const syncing = useGoogleCalendarStore((s) => s.syncing)
  const connecting = useGoogleCalendarStore((s) => s.connecting)
  const connected = useGoogleCalendarStore((s) => s.connected)
  const syncNow = useGoogleCalendarStore((s) => s.syncNow)
  const load = useGoogleCalendarStore((s) => s.load)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const initialSyncDone = useRef(false)

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    function handleOnline() {
      void load()
      if (settings.enabled && settings.autoSync && connected) void syncNow()
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [load, settings.enabled, settings.autoSync, connected, syncNow])

  useEffect(() => {
    if (initialSyncDone.current) return
    if (!settings.enabled || !settings.autoSync || !connected || syncing || connecting) return
    initialSyncDone.current = true
    void syncNow()
  }, [settings.enabled, settings.autoSync, connected, syncing, connecting, syncNow])

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (!settings.enabled || !settings.autoSync || !connected) return

    const intervalMs = Math.max(5, settings.syncIntervalMinutes) * 60_000
    timerRef.current = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine && !syncing && !connecting) {
        void syncNow()
      }
    }, intervalMs)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [
    settings.enabled,
    settings.autoSync,
    settings.syncIntervalMinutes,
    connected,
    syncNow,
    syncing,
    connecting,
  ])
}
