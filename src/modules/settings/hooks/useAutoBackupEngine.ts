import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useBackupStore } from '@/store/backup.store'

const AUTO_CHECK_MS = 15 * 60 * 1000

/** Sauvegarde automatique périodique + chargement historique */
export function useAutoBackupEngine() {
  const userId = useAuthStore((s) => s.user?.id)
  const load = useBackupStore((s) => s.load)
  const runAutoBackupIfDue = useBackupStore((s) => s.runAutoBackupIfDue)

  useEffect(() => {
    if (!userId) return

    void load(userId)
    void runAutoBackupIfDue(userId)

    const interval = window.setInterval(() => {
      void runAutoBackupIfDue(userId)
    }, AUTO_CHECK_MS)

    return () => window.clearInterval(interval)
  }, [userId, load, runAutoBackupIfDue])
}
