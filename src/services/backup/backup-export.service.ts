import { DB_VERSION } from '@/services/indexeddb/schema'
import type {
  BackupArchive,
  BackupExportOptions,
  BackupFormat,
  BackupManifest,
  BackupSnapshotRecord,
} from '@/services/backup/backup.types'
import { BACKUP_APP_ID, BACKUP_FORMAT_VERSION } from '@/services/backup/backup.types'
import { collectBackupPayload, countBackupEntities } from '@/services/backup/backup-collect.service'
import { computeArchiveChecksum } from '@/services/backup/backup-integrity.service'
import {
  archiveToJsonBlob,
  archiveToZipBlob,
  buildBackupFilename,
  downloadBlob,
  gzipStringToBase64,
} from '@/services/backup/backup-compression.service'
import { saveBackupSnapshot } from '@/services/backup/backup-snapshot.service'
import { uploadBackupToCloud, type CloudUploadResult } from '@/services/backup/backup-cloud.provider'

import { env } from '@/config/env'

const APP_VERSION = env.appVersion

export async function buildBackupArchive(
  userId: string,
  label: string,
  source: BackupExportOptions['source'] = 'manual',
): Promise<BackupArchive> {
  const data = await collectBackupPayload(userId)
  const entityCounts = countBackupEntities(data)
  const exportedAt = new Date().toISOString()

  const manifestWithoutChecksum: Omit<BackupManifest, 'checksumSha256'> = {
    formatVersion: BACKUP_FORMAT_VERSION,
    appId: BACKUP_APP_ID,
    appVersion: APP_VERSION,
    dbVersion: DB_VERSION,
    exportedAt,
    userId,
    label,
    source,
    entityCounts,
  }

  const checksumSha256 = await computeArchiveChecksum({ manifest: manifestWithoutChecksum, data })

  return {
    manifest: { ...manifestWithoutChecksum, checksumSha256 },
    data,
  }
}

export async function exportBackup(options: BackupExportOptions): Promise<{
  archive: BackupArchive
  snapshot?: BackupSnapshotRecord
  blob: Blob
  filename: string
  cloudResult: CloudUploadResult
}> {
  const label = options.label ?? `Sauvegarde ${options.source === 'auto' ? 'auto' : 'manuelle'}`
  const archive = await buildBackupArchive(options.userId, label, options.source ?? 'manual')

  const jsonText = JSON.stringify(archive)
  const blob =
    options.format === 'zip' ? archiveToZipBlob(archive) : archiveToJsonBlob(archive)
  const filename = buildBackupFilename(options.format === 'full' ? 'zip' : options.format, label)

  let snapshot: BackupSnapshotRecord | undefined

  if (options.saveLocalSnapshot !== false) {
    const payloadGzipBase64 = gzipStringToBase64(jsonText)
    snapshot = await saveBackupSnapshot({
      archive,
      format: options.format === 'json' ? 'json' : 'zip',
      source: options.source ?? 'manual',
      payloadGzipBase64,
      sizeBytes: blob.size,
    })
  }

  const cloudBlob = archiveToZipBlob(archive)
  const cloudResult = await uploadBackupToCloud(archive, cloudBlob, snapshot?.id)

  return { archive, snapshot, blob, filename, cloudResult }
}

export async function downloadBackupExport(options: BackupExportOptions): Promise<{
  snapshot?: BackupSnapshotRecord
  cloudResult: CloudUploadResult
}> {
  const { blob, filename, snapshot, cloudResult } = await exportBackup({ ...options, downloadFile: true })
  if (options.downloadFile !== false) {
    downloadBlob(blob, filename)
  }
  return { snapshot, cloudResult }
}

export function getExportFormatLabel(format: BackupFormat): string {
  if (format === 'zip' || format === 'full') return 'Archive ZIP'
  return 'JSON'
}
