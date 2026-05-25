/** Configuration production du moteur de synchronisation cloud. */
export const SYNC_ENGINE_CONFIG = {
  maxRetries: 8,
  baseBackoffMs: 2_000,
  maxBackoffMs: 300_000,
  backgroundIntervalMs: 45_000,
  silentSync: true,
  logMaxEntries: 120,
  coalesceQueue: true,
} as const

export type SyncLogLevel = 'info' | 'warn' | 'error' | 'success'

export type SyncLogEntry = {
  id: string
  at: string
  level: SyncLogLevel
  message: string
  detail?: string
  entity?: string
  entityId?: string
}
