import { getDb, setMeta } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import type {
  BackupArchive,
  BackupEntityKey,
  BackupPayload,
  BackupRestoreOptions,
  BackupRestoreResult,
  BackupSettingsPayload,
} from '@/services/backup/backup.types'
import { ALL_BACKUP_ENTITY_KEYS } from '@/services/backup/backup.types'
import { exportBackup } from '@/services/backup/backup-export.service'
import {
  validateReferentialIntegrity,
  verifyBackupArchive,
} from '@/services/backup/backup-integrity.service'
import { getBackupSnapshotPayload } from '@/services/backup/backup-snapshot.service'

const STORE_BY_ENTITY: Record<BackupEntityKey, string | null> = {
  clients: STORES.clients,
  devices: STORES.devices,
  interventions: STORES.interventions,
  interventionPhotos: STORES.interventionPhotos,
  quotes: STORES.quotes,
  invoices: STORES.invoices,
  spareParts: STORES.spareParts,
  stockMovements: STORES.stockMovements,
  activityFeed: STORES.activityFeed,
  aiConversations: STORES.aiConversations,
  settings: null,
}

async function clearStore(storeName: string, userId: string): Promise<void> {
  const db = await getDb()
  const all = await db.getAll(storeName as never)
  const tx = db.transaction(storeName as never, 'readwrite')
  for (const item of all as Array<{ id: string; userId?: string }>) {
    if (!item.userId || item.userId === userId) {
      await tx.store.delete(item.id)
    }
  }
  await tx.done
}

async function bulkPutStore(storeName: string, items: Array<{ id: string }>): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(storeName as never, 'readwrite')
  for (const item of items) {
    await tx.store.put(item as never)
  }
  await tx.done
}

async function restoreSettings(settings: BackupSettingsPayload): Promise<void> {
  if (settings.documentSequences) {
    for (const [key, val] of Object.entries(settings.documentSequences)) {
      await setMeta(key, val)
    }
  }
  if (settings.customMeta) {
    for (const [key, val] of Object.entries(settings.customMeta)) {
      await setMeta(key, val)
    }
  }
  if (settings.lastSyncAt) {
    await setMeta('last_sync_at', settings.lastSyncAt)
  }
  if (settings.backupSettings) {
    await setMeta('backup_settings', settings.backupSettings)
  }
}

async function applyPayload(
  data: BackupPayload,
  entities: BackupEntityKey[],
  userId: string,
  replace: boolean,
): Promise<Partial<Record<BackupEntityKey, number>>> {
  const counts: Partial<Record<BackupEntityKey, number>> = {}

  for (const entity of entities) {
    if (entity === 'settings') {
      await restoreSettings(data.settings)
      counts.settings = Object.keys(data.settings.documentSequences ?? {}).length
      continue
    }

    const storeName = STORE_BY_ENTITY[entity]
    if (!storeName) continue

    const items = (data[entity] as Array<{ id: string; userId?: string }>).map((item) => ({
      ...item,
      userId: item.userId ?? userId,
    }))

    if (replace) {
      await clearStore(storeName, userId)
    }

    if (items.length > 0) {
      await bulkPutStore(storeName, items)
    }

    counts[entity] = items.length
  }

  return counts
}

export async function restoreBackupArchive(
  archive: BackupArchive,
  options: BackupRestoreOptions,
): Promise<BackupRestoreResult> {
  const entities = options.entities?.length ? options.entities : ALL_BACKUP_ENTITY_KEYS

  if (!options.skipIntegrityCheck) {
    const integrity = await verifyBackupArchive(archive)
    if (!integrity.valid) {
      throw new Error(integrity.errors.join(' · ') || 'Intégrité de la sauvegarde invalide')
    }
    const refWarnings = validateReferentialIntegrity(archive.data)
    if (refWarnings.length > 0 && entities.includes('interventions')) {
      console.warn('[backup] avertissements référentiels:', refWarnings)
    }
  }

  let preRestoreSnapshotId: string | undefined

  if (options.createPreRestoreSnapshot !== false) {
    const pre = await exportBackup({
      userId: options.userId,
      format: 'json',
      source: 'pre_restore',
      label: 'Avant restauration',
      saveLocalSnapshot: true,
    })
    preRestoreSnapshotId = pre.snapshot?.id
  }

  const isFull = entities.length === ALL_BACKUP_ENTITY_KEYS.length
  const entityCounts = await applyPayload(archive.data, entities, options.userId, isFull)

  return {
    restored: entities,
    preRestoreSnapshotId,
    entityCounts,
  }
}

export async function rollbackToSnapshot(
  snapshotId: string,
  userId: string,
): Promise<BackupRestoreResult> {
  const archive = await getBackupSnapshotPayload(snapshotId)
  if (!archive) {
    throw new Error('Snapshot introuvable ou payload expiré')
  }
  if (archive.manifest.userId !== userId) {
    throw new Error('Cette sauvegarde appartient à un autre utilisateur')
  }

  return restoreBackupArchive(archive, {
    userId,
    createPreRestoreSnapshot: false,
    entities: ALL_BACKUP_ENTITY_KEYS,
  })
}

export async function importBackupFromArchive(
  archive: BackupArchive,
  options: BackupRestoreOptions,
): Promise<BackupRestoreResult> {
  return restoreBackupArchive(archive, options)
}
