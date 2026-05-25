import type {
  BackupArchive,
  BackupRestoreOptions,
  BackupRestoreResult,
} from '@/services/backup/backup.types'
import { ALL_BACKUP_ENTITY_KEYS } from '@/services/backup/backup.types'
import { getBackupSnapshotPayload } from '@/services/backup/backup-snapshot.service'
import {
  restoreBackupArchiveSafe,
} from '@/services/backup/backup-restore-engine.service'

export async function restoreBackupArchive(
  archive: BackupArchive,
  options: BackupRestoreOptions,
): Promise<BackupRestoreResult> {
  return restoreBackupArchiveSafe(archive, {
    ...options,
    reloadApp: options.reloadApp ?? !options.dryRun,
  })
}

export async function rollbackToSnapshot(
  snapshotId: string,
  userId: string,
): Promise<BackupRestoreResult> {
  const archive = await getBackupSnapshotPayload(snapshotId)
  if (!archive) {
    throw new Error(
      'Snapshot introuvable ou payload absent (local + cloud). Importez le fichier .json/.zip exporté, ou vérifiez que la sauvegarde cloud est bien sur Supabase Storage.',
    )
  }
  if (archive.manifest.userId !== userId) {
    throw new Error('Cette sauvegarde appartient à un autre utilisateur')
  }

  return restoreBackupArchiveSafe(archive, {
    userId,
    createPreRestoreSnapshot: true,
    entities: ALL_BACKUP_ENTITY_KEYS,
    reloadApp: true,
  })
}

export async function importBackupFromArchive(
  archive: BackupArchive,
  options: BackupRestoreOptions,
): Promise<BackupRestoreResult> {
  return restoreBackupArchiveSafe(archive, {
    ...options,
    reloadApp: options.reloadApp ?? !options.dryRun,
  })
}
