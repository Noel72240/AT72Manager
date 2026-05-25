/**
 * Fournisseurs cloud — prêt pour NAS, Nextcloud, Google Drive, Supabase Storage.
 */
import { env } from '@/config/env'
import { getSupabaseClient } from '@/services/supabase/client'
import type { BackupArchive } from '@/services/backup/backup.types'
import { updateSnapshotCloudStatus } from '@/services/backup/backup-snapshot.service'
import { getBackupSettings } from '@/services/backup/backup-settings.service'

export type CloudUploadResult = {
  ok: boolean
  provider: string
  path?: string
  error?: string
}

export async function uploadBackupToCloud(
  archive: BackupArchive,
  blob: Blob,
  snapshotId?: string,
): Promise<CloudUploadResult> {
  const settings = await getBackupSettings()
  if (!settings.cloudEnabled || settings.cloudProvider === 'none') {
    return { ok: false, provider: 'none', error: 'Cloud désactivé' }
  }

  if (snapshotId) {
    await updateSnapshotCloudStatus(snapshotId, 'pending')
  }

  try {
    switch (settings.cloudProvider) {
      case 'supabase':
        return await uploadToSupabaseStorage(archive, blob, snapshotId)
      case 'nextcloud':
      case 'gdrive':
      case 'nas':
        return {
          ok: false,
          provider: settings.cloudProvider,
          error: `${settings.cloudProvider} — connecteur à configurer (bientôt disponible)`,
        }
      default:
        return { ok: false, provider: 'none' }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur cloud'
    if (snapshotId) await updateSnapshotCloudStatus(snapshotId, 'failed', message)
    return { ok: false, provider: settings.cloudProvider, error: message }
  }
}

async function uploadToSupabaseStorage(
  archive: BackupArchive,
  blob: Blob,
  snapshotId?: string,
): Promise<CloudUploadResult> {
  if (!env.isSupabaseConfigured) {
    return { ok: false, provider: 'supabase', error: 'Supabase non configuré' }
  }

  const client = getSupabaseClient()
  if (!client) {
    return { ok: false, provider: 'supabase', error: 'Client Supabase indisponible' }
  }

  const path = `${archive.manifest.userId}/${archive.manifest.exportedAt.replace(/[:.]/g, '-')}.zip`
  const file = new File([blob], path.split('/').pop() ?? 'backup.zip', {
    type: blob.type || 'application/zip',
  })

  const { error } = await client.storage.from('backups').upload(path, file, {
    upsert: true,
    contentType: 'application/zip',
  })

  if (error) {
    if (snapshotId) await updateSnapshotCloudStatus(snapshotId, 'failed', error.message)
    return { ok: false, provider: 'supabase', error: error.message }
  }

  if (snapshotId) await updateSnapshotCloudStatus(snapshotId, 'uploaded')
  return { ok: true, provider: 'supabase', path }
}

/** Enregistre un provider custom (Nextcloud, NAS…) */
let customCloudHandler: ((blob: Blob, meta: BackupArchive['manifest']) => Promise<CloudUploadResult>) | null =
  null

export function registerCustomCloudHandler(
  handler: (blob: Blob, meta: BackupArchive['manifest']) => Promise<CloudUploadResult>,
): void {
  customCloudHandler = handler
}

export async function uploadViaCustomProvider(
  archive: BackupArchive,
  blob: Blob,
): Promise<CloudUploadResult> {
  if (!customCloudHandler) {
    return { ok: false, provider: 'custom', error: 'Aucun handler cloud enregistré' }
  }
  return customCloudHandler(blob, archive.manifest)
}
