import { getDb } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import type { BackupArchive, BackupFormat, BackupSnapshotRecord, BackupSource } from '@/services/backup/backup.types'
import { countBackupEntities } from '@/services/backup/backup-collect.service'
import { getBackupSettings, pruneOldSnapshots } from '@/services/backup/backup-settings.service'
import {
  downloadBackupFromCloud,
  resolveCloudBackupPath,
} from '@/services/backup/backup-cloud-download.service'

export async function listBackupSnapshots(userId: string): Promise<BackupSnapshotRecord[]> {
  const db = await getDb()
  const all = await db.getAll(STORES.backupSnapshots)
  return all
    .filter((s) => s.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getBackupSnapshot(id: string): Promise<BackupSnapshotRecord | undefined> {
  const db = await getDb()
  return db.get(STORES.backupSnapshots, id)
}

export async function getBackupSnapshotPayload(id: string): Promise<BackupArchive | undefined> {
  const record = await getBackupSnapshot(id)
  if (!record) return undefined

  if (record.payloadGzipBase64) {
    const { gunzipBase64ToString, parseBackupJson } = await import(
      '@/services/backup/backup-compression.service'
    )
    try {
      const json = gunzipBase64ToString(record.payloadGzipBase64)
      return parseBackupJson(json)
    } catch {
      /* fallback cloud ci-dessous */
    }
  }

  if (record.cloudStatus === 'uploaded') {
    try {
      const path =
        record.cloudStoragePath ??
        (await resolveCloudBackupPath(record.userId, record.createdAt, record.cloudStoragePath))
      if (path) {
        return await downloadBackupFromCloud(path)
      }
    } catch (error) {
      console.warn('[backup] cloud payload download failed', error)
    }
  }

  return undefined
}

export async function saveBackupSnapshot(input: {
  archive: BackupArchive
  format: BackupFormat
  source: BackupSource
  payloadGzipBase64?: string
  sizeBytes: number
}): Promise<BackupSnapshotRecord> {
  const db = await getDb()
  const settings = await getBackupSettings()
  const id = crypto.randomUUID()
  const record: BackupSnapshotRecord = {
    id,
    label: input.archive.manifest.label ?? 'Sauvegarde',
    createdAt: input.archive.manifest.exportedAt,
    status: 'verified',
    format: input.format,
    source: input.source,
    sizeBytes: input.sizeBytes,
    checksumSha256: input.archive.manifest.checksumSha256,
    entityCounts: countBackupEntities(input.archive.data),
    userId: input.archive.manifest.userId,
    integrityVerified: true,
    cloudStatus: 'none',
    cloudProvider: settings.cloudProvider,
    payloadGzipBase64: input.payloadGzipBase64,
  }

  await db.put(STORES.backupSnapshots, record)
  await pruneOldSnapshots(record.userId)
  return record
}

export async function deleteBackupSnapshot(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORES.backupSnapshots, id)
}

export async function updateSnapshotCloudStatus(
  id: string,
  cloudStatus: BackupSnapshotRecord['cloudStatus'],
  options?: { errorMessage?: string; cloudStoragePath?: string },
): Promise<void> {
  const record = await getBackupSnapshot(id)
  if (!record) return
  const db = await getDb()
  await db.put(STORES.backupSnapshots, {
    ...record,
    cloudStatus,
    errorMessage: options?.errorMessage,
    cloudStoragePath: options?.cloudStoragePath ?? record.cloudStoragePath,
  })
}
