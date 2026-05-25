import { isTauri } from '@tauri-apps/api/core'
import { env } from '@/config/env'
import { getLastDbInitResult, initLocalDatabase, resetDbConnection } from '@/services/indexeddb/db'
import { deleteDB } from 'idb'
import { DB_NAME } from '@/services/indexeddb/schema'
import { productionLogger } from '@/services/desktop/production-logger.service'
import { openLogsFolder } from '@/services/desktop/paths.service'

export type RecoveryAction =
  | 'reload'
  | 'reinit_db'
  | 'open_logs'
  | 'clear_auth'

export type RecoveryState = {
  dbStatus: string | null
  isProduction: boolean
  isTauri: boolean
  supabaseConfigured: boolean
  googleCalendarConfigured: boolean
}

export function getRecoveryState(): RecoveryState {
  const db = getLastDbInitResult()
  return {
    dbStatus: db?.status ?? null,
    isProduction: env.isProduction,
    isTauri: isTauri(),
    supabaseConfigured: env.isSupabaseConfigured,
    googleCalendarConfigured: env.isGoogleCalendarConfigured,
  }
}

export async function runRecoveryAction(action: RecoveryAction): Promise<void> {
  productionLogger.info('recovery', action)

  switch (action) {
    case 'reload':
      window.location.reload()
      return
    case 'open_logs':
      await openLogsFolder()
      return
    case 'clear_auth':
      try {
        localStorage.removeItem('at72manager-auth')
        sessionStorage.clear()
      } catch {
        /* ignore */
      }
      window.location.hash = '#/login'
      window.location.reload()
      return
    case 'reinit_db':
      resetDbConnection()
      try {
        await deleteDB(DB_NAME, { blocked: () => {
          productionLogger.warn('reinit_db', 'delete blocked — fermez les autres fenêtres AT72Manager')
        } })
      } catch (error) {
        productionLogger.error('reinit_db delete failed', String(error))
      }
      await initLocalDatabase()
      window.location.reload()
      return
    default:
      return
  }
}
