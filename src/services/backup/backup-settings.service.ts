import { getMeta, setMeta } from '@/services/indexeddb/db'
import type { BackupSettings } from '@/services/backup/backup.types'
import { DEFAULT_BACKUP_SETTINGS } from '@/services/backup/backup.types'
import { deleteBackupSnapshot, listBackupSnapshots } from '@/services/backup/backup-snapshot.service'

const META_KEY = 'backup_settings'

export async function getBackupSettings(): Promise<BackupSettings> {
  const stored = await getMeta<BackupSettings>(META_KEY)
  return { ...DEFAULT_BACKUP_SETTINGS, ...stored }
}

export async function saveBackupSettings(settings: BackupSettings): Promise<void> {
  await setMeta(META_KEY, settings)
}

export async function markAutoBackupCompleted(): Promise<void> {
  const settings = await getBackupSettings()
  await saveBackupSettings({
    ...settings,
    lastAutoBackupAt: new Date().toISOString(),
  })
}

export function shouldRunAutoBackup(settings: BackupSettings): boolean {
  if (!settings.autoBackupEnabled) return false
  if (!settings.lastAutoBackupAt) return true
  const elapsed = Date.now() - new Date(settings.lastAutoBackupAt).getTime()
  return elapsed >= settings.autoBackupIntervalHours * 60 * 60 * 1000
}

export async function pruneOldSnapshots(userId: string): Promise<void> {
  const settings = await getBackupSettings()
  const snapshots = await listBackupSnapshots(userId)
  const excess = snapshots.slice(settings.maxLocalSnapshots)
  for (const snap of excess) {
    await deleteBackupSnapshot(snap.id)
  }
}
