import { getDb, resetDbConnection, setMeta } from '@/services/indexeddb/db'
import { DB_VERSION, STORES } from '@/services/indexeddb/schema'
import type {
  BackupArchive,
  BackupEntityKey,
  BackupPayload,
  BackupRestoreOptions,
  BackupRestoreResult,
  BackupSettingsPayload,
} from '@/services/backup/backup.types'
import { ALL_BACKUP_ENTITY_KEYS } from '@/services/backup/backup.types'
import { buildBackupArchive } from '@/services/backup/backup-export.service'
import { saveBackupSnapshot } from '@/services/backup/backup-snapshot.service'
import {
  validateReferentialIntegrity,
  verifyBackupArchive,
} from '@/services/backup/backup-integrity.service'
import { createBackupLogger, type BackupLogger } from '@/services/backup/backup-logger.service'
import { gzipStringToBase64 } from '@/services/backup/backup-compression.service'
import { normalizeBackupArchive } from '@/services/backup/backup-normalize.service'
import { reconcileRestoredDataWithSupabase } from '@/services/backup/backup-post-restore-sync.service'
const STORE_BY_ENTITY: Record<BackupEntityKey, string | null> = {
  clients: STORES.clients,
  devices: STORES.devices,
  interventions: STORES.interventions,
  interventionPhotos: STORES.interventionPhotos,
  spareParts: STORES.spareParts,
  stockMovements: STORES.stockMovements,
  activityFeed: STORES.activityFeed,
  aiConversations: STORES.aiConversations,
  calendarLinks: STORES.calendarSyncLinks,
  calendarQueue: STORES.googleCalendarQueue,
  settings: null,
}

async function replaceStoreRecords<T extends { id: string }>(
  storeName: string,
  items: T[],
): Promise<number> {
  const db = await getDb()
  const tx = db.transaction(storeName as never, 'readwrite')
  await tx.store.clear()
  for (const item of items) {
    await tx.store.put(item as never)
  }
  await tx.done
  return items.length
}

async function restoreSettings(settings: BackupSettingsPayload, logger: BackupLogger): Promise<number> {
  let count = 0
  if (settings.documentSequences) {
    for (const [key, val] of Object.entries(settings.documentSequences)) {
      await setMeta(key, val)
      count++
    }
  }
  if (settings.customMeta) {
    for (const [key, val] of Object.entries(settings.customMeta)) {
      await setMeta(key, val)
      count++
    }
  }
  if (settings.lastSyncAt) {
    await setMeta('last_sync_at', settings.lastSyncAt)
    count++
  }
  if (settings.backupSettings) {
    await setMeta('backup_settings', settings.backupSettings)
    count++
  }
  logger.info('settings_restored', `${count} entrée(s) métadonnées`)
  return count
}

async function applyPayload(
  data: BackupPayload,
  entities: BackupEntityKey[],
  userId: string,
  logger: BackupLogger,
  dryRun: boolean,
): Promise<Partial<Record<BackupEntityKey, number>>> {
  const counts: Partial<Record<BackupEntityKey, number>> = {}

  for (const entity of entities) {
    if (entity === 'settings') {
      const settings = data.settings ?? {
        documentSequences: {},
        customMeta: {},
      }
      if (dryRun) {
        counts.settings =
          Object.keys(settings.documentSequences ?? {}).length +
          Object.keys(settings.customMeta ?? {}).length
        continue
      }
      counts.settings = await restoreSettings(settings, logger)
      continue
    }

    const storeName = STORE_BY_ENTITY[entity]
    if (!storeName) continue

    const raw = (data[entity] as Array<{ id: string; userId?: string }> | undefined) ?? []
    const items = raw.map((item) => ({
      ...item,
      userId: item.userId ?? userId,
    }))

    if (dryRun) {
      counts[entity] = items.length
      logger.info('dry_run_entity', `${entity}: ${items.length} enregistrement(s)`)
      continue
    }

    const n = await replaceStoreRecords(storeName, items)
    counts[entity] = n
    logger.info('store_replaced', `${entity}: ${n} enregistrement(s)`)
  }

  return counts
}

function validateStructureCompatibility(archive: BackupArchive, logger: BackupLogger): void {
  if (archive.manifest.dbVersion > DB_VERSION) {
    throw new Error(
      `Sauvegarde créée avec une base plus récente (v${archive.manifest.dbVersion}) que l'application (v${DB_VERSION}). Mettez à jour AT72Manager.`,
    )
  }
  if (archive.manifest.dbVersion < DB_VERSION) {
    logger.warn(
      'db_version_older',
      `Sauvegarde base v${archive.manifest.dbVersion}, application v${DB_VERSION} — migration automatique des stores au prochain démarrage.`,
    )
  }
}

export function reloadApplicationAfterRestore(delayMs = 400): void {
  resetDbConnection()
  window.dispatchEvent(new CustomEvent('at72:backup-restored'))
  window.setTimeout(() => {
    window.location.reload()
  }, delayMs)
}

export async function restoreBackupArchiveSafe(
  rawArchive: BackupArchive,
  options: BackupRestoreOptions,
): Promise<BackupRestoreResult> {
  const logger = createBackupLogger()
  const entities = options.entities?.length ? options.entities : ALL_BACKUP_ENTITY_KEYS
  const dryRun = options.dryRun === true
  const archive = normalizeBackupArchive(rawArchive)

  logger.info(
    'restore_started',
    dryRun ? 'Simulation (dry-run)' : 'Restauration démarrée',
    entities.join(', '),
  )

  if (!options.skipIntegrityCheck) {
    const integrity = await verifyBackupArchive(archive)
    if (!integrity.valid) {
      logger.error('integrity_failed', integrity.errors.join(' · '))
      throw new Error(integrity.errors.join(' · ') || 'Intégrité de la sauvegarde invalide')
    }
    logger.success('integrity_ok', 'Checksum SHA-256 et format validés')
    for (const w of integrity.warnings) logger.warn('integrity_warning', w)
  }

  validateStructureCompatibility(archive, logger)

  const refWarnings = validateReferentialIntegrity(archive.data)
  for (const w of refWarnings) logger.warn('referential_warning', w)

  if (dryRun) {
    const entityCounts = await applyPayload(
      archive.data,
      entities,
      options.userId,
      logger,
      true,
    )
    logger.success('dry_run_complete', 'Simulation terminée — aucune donnée modifiée')
    return {
      restored: entities,
      entityCounts,
      dryRun: true,
      logs: logger.entries,
    }
  }

  let preRestoreSnapshotId: string | undefined
  let rollbackArchive: BackupArchive | null = null

  if (options.createPreRestoreSnapshot !== false) {
    logger.info('pre_snapshot_start', 'Sauvegarde de sécurité avant restauration…')
    rollbackArchive = normalizeBackupArchive(
      await buildBackupArchive(options.userId, 'Avant restauration', 'pre_restore'),
    )
    try {
      const jsonText = JSON.stringify(rollbackArchive)
      const gzip = gzipStringToBase64(jsonText)
      const snap = await saveBackupSnapshot({
        archive: rollbackArchive,
        format: 'json',
        source: 'pre_restore',
        payloadGzipBase64: gzip.length < 12_000_000 ? gzip : undefined,
        sizeBytes: jsonText.length,
      })
      preRestoreSnapshotId = snap.id
      if (!snap.payloadGzipBase64) {
        logger.warn(
          'pre_snapshot_no_payload',
          'Snapshot sécurité enregistré sans payload local (taille) — rollback fichier déconseillé.',
        )
      } else {
        logger.success('pre_snapshot_saved', `Snapshot ${snap.id.slice(0, 8)}…`)
      }
    } catch (error) {
      logger.warn(
        'pre_snapshot_save_failed',
        'Impossible d’enregistrer le snapshot local',
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  try {
    const entityCounts = await applyPayload(
      archive.data,
      entities,
      options.userId,
      logger,
      false,
    )

    await reconcileRestoredDataWithSupabase(archive.data, entities, logger)

    resetDbConnection()

    logger.success(
      'restore_success',
      `Restauration réussie — ${entities.length} section(s)`,
      JSON.stringify(entityCounts),
    )

    const result: BackupRestoreResult = {
      restored: entities,
      preRestoreSnapshotId,
      entityCounts,
      dryRun: false,
      logs: logger.entries,
      autoRollbackApplied: false,
    }

    if (options.reloadApp !== false) {
      logger.info('reload_scheduled', 'Rechargement de l’application…')
      reloadApplicationAfterRestore()
    }

    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error('restore_failed', message)

    if (rollbackArchive) {
      try {
        logger.info('auto_rollback_start', 'Restauration de l’état précédent…')
        await applyPayload(
          rollbackArchive.data,
          ALL_BACKUP_ENTITY_KEYS,
          options.userId,
          logger,
          false,
        )
        resetDbConnection()
        logger.success('auto_rollback_success', 'État précédent rétabli après échec')
        const err = new Error(
          `${message} — L’atelier a été automatiquement rétabli à l’état d’avant la restauration.`,
        ) as Error & { autoRollbackApplied?: boolean; backupLogs?: typeof logger.entries }
        err.autoRollbackApplied = true
        err.backupLogs = logger.entries
        throw err
      } catch (rollbackError) {
        logger.error(
          'auto_rollback_failed',
          'Échec du rollback automatique',
          rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
        )
        throw new Error(
          `${message} — Rollback automatique impossible. Restaurez manuellement un snapshot « Avant restauration ».`,
        )
      }
    }

    throw error
  }
}
