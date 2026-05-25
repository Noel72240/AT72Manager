import { invoke } from '@tauri-apps/api/core'
import { isTauri } from '@tauri-apps/api/core'

export type AppPaths = {
  appDataDir: string
  logsDir: string
  crashDir: string
  configDir: string
}

let cachedPaths: AppPaths | null = null

export async function getAppPaths(): Promise<AppPaths | null> {
  if (!isTauri()) return null
  if (cachedPaths) return cachedPaths
  try {
    cachedPaths = await invoke<AppPaths>('get_app_paths')
    return cachedPaths
  } catch (error) {
    console.error('[paths] get_app_paths failed:', error)
    return null
  }
}

export async function openLogsFolder(): Promise<void> {
  if (!isTauri()) return
  await invoke('open_logs_folder')
}
