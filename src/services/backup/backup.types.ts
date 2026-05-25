/** Format de sauvegarde AT72Manager — versionné et extensible */

export const BACKUP_FORMAT_VERSION = 1
export const BACKUP_APP_ID = 'at72manager'

export type BackupEntityKey =
  | 'clients'
  | 'devices'
  | 'interventions'
  | 'interventionPhotos'
  | 'quotes'
  | 'invoices'
  | 'spareParts'
  | 'stockMovements'
  | 'activityFeed'
  | 'aiConversations'
  | 'settings'

export const ALL_BACKUP_ENTITY_KEYS: BackupEntityKey[] = [
  'clients',
  'devices',
  'interventions',
  'interventionPhotos',
  'quotes',
  'invoices',
  'spareParts',
  'stockMovements',
  'activityFeed',
  'aiConversations',
  'settings',
]

export const BACKUP_ENTITY_LABELS: Record<BackupEntityKey, string> = {
  clients: 'Clients',
  devices: 'Appareils',
  interventions: 'Interventions',
  interventionPhotos: 'Photos interventions',
  quotes: 'Devis',
  invoices: 'Factures',
  spareParts: 'Stock — pièces',
  stockMovements: 'Stock — mouvements',
  activityFeed: 'Fil d\'activité',
  aiConversations: 'Conversations IA',
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
  quotes: unknown[]
  invoices: unknown[]
  spareParts: unknown[]
  stockMovements: unknown[]
  activityFeed: unknown[]
  aiConversations: unknown[]
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
}

export type BackupRestoreResult = {
  restored: BackupEntityKey[]
  preRestoreSnapshotId?: string
  entityCounts: Partial<Record<BackupEntityKey, number>>
}

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
