/** Format de sauvegarde AT72Manager — versionné et extensible */

import type { BackupLogEntry } from '@/services/backup/backup-logger.service'

export const BACKUP_FORMAT_VERSION = 1
export const BACKUP_APP_ID = 'at72manager'

export type BackupEntityKey =
  | 'clients'
  | 'devices'
  | 'interventions'
  | 'interventionPhotos'
  | 'spareParts'
  | 'stockMovements'
  | 'activityFeed'
  | 'aiConversations'
  | 'calendarLinks'
  | 'calendarQueue'
  | 'settings'

export const ALL_BACKUP_ENTITY_KEYS: BackupEntityKey[] = [
  'clients',
  'devices',
  'interventions',
  'interventionPhotos',
  'spareParts',
  'stockMovements',
  'activityFeed',
  'aiConversations',
  'calendarLinks',
  'calendarQueue',
  'settings',
]

export const BACKUP_ENTITY_LABELS: Record<BackupEntityKey, string> = {
  clients: 'Clients',
  devices: 'Appareils',
  interventions: 'Interventions',
  interventionPhotos: 'Photos interventions',
  spareParts: 'Stock — pièces',
  stockMovements: 'Stock — mouvements',
  activityFeed: 'Fil d\'activité',
  aiConversations: 'Conversations IA',
  calendarLinks: 'Planning — liens agenda',
  calendarQueue: 'Planning — file sync',
  settings: 'Paramètres & métadonnées',
}

export type BackupSettingsPayload = {
  themeMode?: string
  backupSettings?: unknown
  documentSequences?: Record<string, number>
  lastSyncAt?: string
  customMeta?: Record<string, unknown>
}

export type BackupPayload = {
  clients: unknown[]
  devices: unknown[]
  interventions: unknown[]
  interventionPhotos: unknown[]
  spareParts: unknown[]
  stockMovements: unknown[]
  activityFeed: unknown[]
  aiConversations: unknown[]
  calendarLinks: unknown[]
  calendarQueue: unknown[]
  settings: BackupSettingsPayload
}

export type BackupManifest = {
  formatVersion: number
  appId: typeof BACKUP_APP_ID
  appVersion: string
  dbVersion: number
  exportedAt: string
  userId: string
  label?: string
  source: BackupSource
  entityCounts: Partial<Record<BackupEntityKey, number>>
  checksumSha256: string
}

export type BackupArchive = {
  manifest: BackupManifest
  data: BackupPayload
}

export type BackupSource = 'manual' | 'auto' | 'pre_restore' | 'import'

export type BackupFormat = 'json' | 'zip' | 'full'

export type BackupStatus = 'in_progress' | 'completed' | 'failed' | 'verified'

export type BackupCloudProvider = 'none' | 'supabase' | 'nextcloud' | 'gdrive' | 'nas'

export type BackupCloudStatus = 'none' | 'pending' | 'uploaded' | 'failed'

export type CloudBackupFile = {
  name: string
  path: string
  sizeBytes: number
  createdAt: string
}

export type BackupSnapshotRecord = {
  id: string
  label: string
  createdAt: string
  status: BackupStatus
  format: BackupFormat
  source: BackupSource
  sizeBytes: number
  checksumSha256: string
  entityCounts: Partial<Record<BackupEntityKey, number>>
  userId: string
  integrityVerified: boolean
  cloudStatus: BackupCloudStatus
  cloudProvider: BackupCloudProvider
  /** Chemin Supabase Storage (ex. userId/2026-05-24T12-00-00-000Z.zip) */
  cloudStoragePath?: string
  /** Archive gzip base64 pour rollback local (snapshots récents) */
  payloadGzipBase64?: string
  errorMessage?: string
}

export type BackupSettings = {
  autoBackupEnabled: boolean
  autoBackupIntervalHours: number
  maxLocalSnapshots: number
  lastAutoBackupAt?: string
  cloudEnabled: boolean
  cloudProvider: BackupCloudProvider
  /** Préparation chiffrement futur */
  encryptionEnabled: boolean
}

export type BackupExportOptions = {
  label?: string
  source?: BackupSource
  format: BackupFormat
  userId: string
  saveLocalSnapshot?: boolean
  /** Télécharger le fichier (désactivé pour sauvegarde auto silencieuse) */
  downloadFile?: boolean
}

export type BackupRestoreOptions = {
  userId: string
  entities?: BackupEntityKey[]
  createPreRestoreSnapshot?: boolean
  skipIntegrityCheck?: boolean
  /** Simule la restauration sans modifier IndexedDB */
  dryRun?: boolean
  /** Recharge l’application après succès (recommandé) */
  reloadApp?: boolean
}

export type BackupRestoreResult = {
  restored: BackupEntityKey[]
  preRestoreSnapshotId?: string
  entityCounts: Partial<Record<BackupEntityKey, number>>
  dryRun?: boolean
  autoRollbackApplied?: boolean
  logs?: BackupLogEntry[]
}

export type { BackupLogEntry, BackupLogLevel } from '@/services/backup/backup-logger.service'

export type BackupIntegrityResult = {
  valid: boolean
  checksumMatch: boolean
  formatValid: boolean
  errors: string[]
  warnings: string[]
}

export const DEFAULT_BACKUP_SETTINGS: BackupSettings = {
  autoBackupEnabled: true,
  autoBackupIntervalHours: 24,
  maxLocalSnapshots: 8,
  cloudEnabled: false,
  cloudProvider: 'none',
  encryptionEnabled: false,
}
