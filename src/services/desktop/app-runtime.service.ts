import { isTauri } from '@tauri-apps/api/core'
import { env } from '@/config/env'
import { installCrashHandlers } from '@/services/desktop/crash-report.service'
import { getAppPaths } from '@/services/desktop/paths.service'
import { productionLogger } from '@/services/desktop/production-logger.service'

let initialized = false

/**
 * Initialisation runtime desktop (production) : chemins Windows, logs fichier, crash handlers.
 */
export async function initAppRuntime(): Promise<void> {
  if (initialized) return
  initialized = true

  installCrashHandlers()

  if (!isTauri()) {
    productionLogger.info('runtime:web', env.appEnvironment)
    return
  }

  const paths = await getAppPaths()
  productionLogger.info('runtime:desktop', JSON.stringify({
    version: env.appVersion,
    environment: env.appEnvironment,
    supabase: env.isSupabaseConfigured,
    googleCalendar: env.isGoogleCalendarConfigured,
    paths: paths?.logsDir,
  }))
}
