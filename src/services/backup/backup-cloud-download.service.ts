import { env } from '@/config/env'
import { getSupabaseClient } from '@/services/supabase/client'
import type { BackupArchive, CloudBackupFile } from '@/services/backup/backup.types'
import { parseBackupFile } from '@/services/backup/backup-compression.service'

export function buildCloudBackupPath(userId: string, exportedAt: string): string {
  return `${userId}/${exportedAt.replace(/[:.]/g, '-')}.zip`
}

export async function downloadBackupFromCloud(path: string): Promise<BackupArchive> {
  if (!env.isSupabaseConfigured) {
    throw new Error('Supabase non configuré')
  }

  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Client Supabase indisponible')
  }

  const { data, error } = await client.storage.from('backups').download(path)
  if (error || !data) {
    throw new Error(error?.message ?? 'Fichier cloud introuvable')
  }

  return parseBackupFile(new File([data], path.split('/').pop() ?? 'backup.zip', { type: 'application/zip' }))
}

export async function listCloudBackups(userId: string): Promise<CloudBackupFile[]> {
  if (!env.isSupabaseConfigured) return []

  const client = getSupabaseClient()
  if (!client) return []

  const { data, error } = await client.storage.from('backups').list(userId, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' },
  })

  if (error || !data?.length) return []

  return data
    .filter((file) => file.name.endsWith('.zip'))
    .map((file) => ({
      name: file.name,
      path: `${userId}/${file.name}`,
      sizeBytes: file.metadata?.size ?? 0,
      createdAt: file.created_at ?? file.updated_at ?? new Date().toISOString(),
    }))
}

export async function resolveCloudBackupPath(
  userId: string,
  exportedAt: string,
  preferredPath?: string,
): Promise<string | undefined> {
  if (!env.isSupabaseConfigured) return undefined

  const client = getSupabaseClient()
  if (!client) return undefined

  const candidates = [
    preferredPath,
    buildCloudBackupPath(userId, exportedAt),
  ].filter(Boolean) as string[]

  for (const path of candidates) {
    const { data, error } = await client.storage.from('backups').download(path)
    if (!error && data) return path
  }

  const folder = userId
  const { data: files } = await client.storage.from('backups').list(folder, { limit: 100 })
  if (!files?.length) return undefined

  const isoPrefix = exportedAt.replace(/[:.]/g, '-').slice(0, 19)
  const match = files.find((f) => f.name.includes(isoPrefix) && f.name.endsWith('.zip'))
  return match ? `${folder}/${match.name}` : undefined
}
