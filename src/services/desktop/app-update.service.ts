import { env } from '@/config/env'

export type AppVersionInfo = {
  current: string
  channel: 'stable' | 'beta'
  updateAvailable: boolean
  latestVersion?: string
  releaseNotes?: string
}

/** Vérification MAJ — prêt pour brancher Tauri updater / endpoint releases. */
export const appUpdateService = {
  getCurrentVersion(): string {
    return env.appVersion
  },

  async checkForUpdates(): Promise<AppVersionInfo> {
    return {
      current: env.appVersion,
      channel: 'stable',
      updateAvailable: false,
    }
  },
}
