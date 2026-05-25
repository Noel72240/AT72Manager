import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from 'idb'

import type { AiConversation } from '@/services/ai/types'
import type {
  Client,
  Device,
  Intervention,
  SparePart,
  ActivityFeedItem,
  StockMovement,
  SyncQueueItem,
} from '@/types/entities'
import type { StoredInterventionPhoto } from '@/modules/interventions/field/services/intervention-photo-storage.service'
import type { InterventionDocument, InterventionDocumentEvent } from '@/types/entities/intervention-document.types'
import { DB_NAME, DB_VERSION, STORES } from './schema'
import type { BackupSnapshotRecord } from '@/services/backup/backup.types'
import type { AuditLogEntry, SecurityLogEntry, UserSessionRecord } from '@/types/audit.types'
import type { ProfileRecord } from '@/types/workshop.types'
import { META_SCHEMA_VERSION_KEY, runAllMigrations } from '@/services/indexeddb/migrations'
import type { CalendarSyncLink, GoogleCalendarQueueItem } from '@/services/calendar/google/google-calendar.types'
import type { PortalDataSnapshot } from '@/types/portal.types'

export interface AT72DbSchema extends DBSchema {
  meta: { key: string; value: unknown }
  sync_queue: {
    key: string
    value: SyncQueueItem
    indexes: { 'by-status': SyncQueueItem['status'] }
  }
  clients: { key: string; value: Client }
  interventions: { key: string; value: Intervention }
  devices: { key: string; value: Device }
  intervention_photos: {
    key: string
    value: StoredInterventionPhoto
    indexes: { 'by-intervention': string }
  }
  intervention_documents: {
    key: string
    value: InterventionDocument
    indexes: { 'by-intervention': string }
  }
  intervention_document_events: {
    key: string
    value: InterventionDocumentEvent
    indexes: { 'by-intervention': string; 'by-document': string }
  }
  intervention_document_blobs: {
    key: string
    value: { id: string; dataUrl: string }
  }
  quotes: { key: string; value: Record<string, unknown> }
  invoices: { key: string; value: Record<string, unknown> }
  spare_parts: { key: string; value: SparePart }
  stock_movements: {
    key: string
    value: StockMovement
    indexes: { 'by-part': string }
  }
  activity_feed: {
    key: string
    value: ActivityFeedItem
    indexes: { 'by-created': string }
  }
  ai_conversations: {
    key: string
    value: AiConversation
    indexes: { 'by-updated': string }
  }
  backup_snapshots: {
    key: string
    value: BackupSnapshotRecord
    indexes: { 'by-created': string }
  }
  profiles: { key: string; value: ProfileRecord }
  audit_logs: {
    key: string
    value: AuditLogEntry
    indexes: { 'by-created': string }
  }
  security_logs: {
    key: string
    value: SecurityLogEntry
    indexes: { 'by-created': string }
  }
  user_sessions: {
    key: string
    value: UserSessionRecord
    indexes: { 'by-user': string }
  }
  calendar_sync_links: {
    key: string
    value: CalendarSyncLink
    indexes: { 'by-google-event': string; 'by-status': CalendarSyncLink['status'] }
  }
  google_calendar_queue: {
    key: string
    value: GoogleCalendarQueueItem
    indexes: { 'by-intervention': string }
  }
  portal_cache: {
    key: string
    value: PortalDataSnapshot
  }
}

export type DbInitStatus = 'ready' | 'recovered' | 'rebuilt' | 'degraded'

export type DbInitResult = {
  status: DbInitStatus
  version: number
  message?: string
}

let dbPromise: Promise<IDBPDatabase<AT72DbSchema>> | null = null
let initResult: DbInitResult | null = null
let recoveryAttempts = 0
const MAX_RECOVERY_ATTEMPTS = 2

export function resetDbConnection(): void {
  dbPromise = null
}

export function getLastDbInitResult(): DbInitResult | null {
  return initResult
}

function getMissingStores(db: IDBPDatabase<AT72DbSchema>): string[] {
  return Object.values(STORES).filter((name) => !db.objectStoreNames.contains(name))
}

function logMigrationPhase(message: string, detail?: Record<string, unknown>): void {
  if (detail) {
    console.info(`[idb:migration] ${message}`, detail)
  } else {
    console.info(`[idb:migration] ${message}`)
  }
}

function runUpgrade(db: IDBPDatabase<AT72DbSchema>, oldVersion: number, newVersion: number): void {
  logMigrationPhase(`upgrade ${oldVersion} → ${newVersion}`)
  runAllMigrations(db as IDBPDatabase, oldVersion, newVersion)
}

async function persistSchemaVersion(db: IDBPDatabase<AT72DbSchema>): Promise<void> {
  try {
    await db.put(STORES.meta, DB_VERSION, META_SCHEMA_VERSION_KEY)
  } catch (error) {
    console.warn('[idb:migration] impossible d\'écrire schema_version:', error)
  }
}

async function validateOrThrow(db: IDBPDatabase<AT72DbSchema>): Promise<void> {
  const missing = getMissingStores(db)
  if (missing.length > 0) {
    throw new Error(`IndexedDB incomplet (stores manquants : ${missing.join(', ')})`)
  }
  await persistSchemaVersion(db)
}

async function openDatabaseOnce(): Promise<IDBPDatabase<AT72DbSchema>> {
  const db = await openDB<AT72DbSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      runUpgrade(db, oldVersion, newVersion ?? DB_VERSION)
    },
    blocked(currentVersion, blockedVersion, event) {
      logMigrationPhase('bloquée — autre onglet ou fenêtre ouverte', {
        currentVersion,
        blockedVersion,
        event,
      })
    },
    blocking() {
      logMigrationPhase('fermeture connexion pour migration sur un autre onglet')
    },
    terminated() {
      logMigrationPhase('connexion terminée — reset')
      resetDbConnection()
    },
  })

  await validateOrThrow(db)
  return db
}

async function rebuildDatabase(reason: string): Promise<IDBPDatabase<AT72DbSchema>> {
  logMigrationPhase(`rebuild complet — ${reason}`)
  resetDbConnection()

  try {
    await deleteDB(DB_NAME, {
      blocked() {
        logMigrationPhase('deleteDB bloqué — fermez les autres fenêtres AT72Manager')
      },
    })
  } catch (error) {
    console.warn('[idb:migration] deleteDB échoué:', error)
  }

  const db = await openDB<AT72DbSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, _oldVersion, newVersion) {
      logMigrationPhase(`rebuild upgrade → v${newVersion ?? DB_VERSION}`)
      runAllMigrations(db as IDBPDatabase, 0, newVersion ?? DB_VERSION)
    },
  })

  await validateOrThrow(db)
  return db
}

async function openDatabaseWithRecovery(): Promise<{
  db: IDBPDatabase<AT72DbSchema>
  status: DbInitStatus
}> {
  try {
    const db = await openDatabaseOnce()
    return { db, status: 'ready' }
  } catch (firstError) {
    const reason = firstError instanceof Error ? firstError.message : String(firstError)
    logMigrationPhase('échec ouverture — tentative recovery', { reason })

    if (recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
      throw firstError
    }

    recoveryAttempts += 1

    const db = await rebuildDatabase(reason)
    return { db, status: 'rebuilt' }
  }
}

function ensureDbPromise(): Promise<IDBPDatabase<AT72DbSchema>> {
  if (!dbPromise) {
    dbPromise = openDatabaseWithRecovery()
      .then(({ db, status }) => {
        if (status === 'rebuilt') {
          initResult = {
            status: 'rebuilt',
            version: DB_VERSION,
            message: 'Base locale reconstruite — resynchronisation depuis le cloud.',
          }
        }
        return db
      })
      .catch((error) => {
        resetDbConnection()
        throw error
      })
  }
  return dbPromise
}

export function getDb(): Promise<IDBPDatabase<AT72DbSchema>> {
  return ensureDbPromise()
}

/** Initialise la base locale avec auto-recovery — mode dégradé si échec total */
export async function initLocalDatabase(): Promise<DbInitResult> {
  if (initResult && dbPromise) {
    try {
      await dbPromise
      return initResult
    } catch {
      /* retry below */
    }
  }

  recoveryAttempts = 0
  resetDbConnection()
  dbPromise = null

  try {
    const { db, status } = await openDatabaseWithRecovery()
    dbPromise = Promise.resolve(db)

    initResult = {
      status,
      version: DB_VERSION,
      message:
        status === 'rebuilt'
          ? 'Base locale reconstruite. Resynchronisation recommandée.'
          : undefined,
    }

    logMigrationPhase('init OK', { status, version: DB_VERSION })
    return initResult
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[idb:migration] init échoué après recovery:', error)

    initResult = {
      status: 'degraded',
      version: DB_VERSION,
      message,
    }

    return initResult
  }
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const db = await getDb()
  return db.get(STORES.meta, key) as Promise<T | undefined>
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDb()
  await db.put(STORES.meta, value, key)
}

export async function rebuildLocalDatabase(): Promise<DbInitResult> {
  resetDbConnection()
  dbPromise = null
  recoveryAttempts = 0
  const db = await rebuildDatabase('manual')
  dbPromise = Promise.resolve(db)
  initResult = { status: 'rebuilt', version: DB_VERSION }
  return initResult
}
