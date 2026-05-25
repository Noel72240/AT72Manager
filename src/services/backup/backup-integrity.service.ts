import type { BackupArchive, BackupIntegrityResult, BackupManifest } from '@/services/backup/backup.types'
import { BACKUP_APP_ID, BACKUP_FORMAT_VERSION } from '@/services/backup/backup.types'

export async function sha256Hex(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** JSON canonique stable pour checksum (sans checksum dans manifest) */
export function serializeArchiveForChecksum(archive: Omit<BackupArchive, 'manifest'> & {
  manifest: Omit<BackupManifest, 'checksumSha256'>
}): string {
  return JSON.stringify({ manifest: archive.manifest, data: archive.data })
}

export async function computeArchiveChecksum(
  archive: Omit<BackupArchive, 'manifest'> & { manifest: Omit<BackupManifest, 'checksumSha256'> },
): Promise<string> {
  return sha256Hex(serializeArchiveForChecksum(archive))
}

export async function verifyBackupArchive(archive: unknown): Promise<BackupIntegrityResult> {
  const errors: string[] = []
  const warnings: string[] = []

  if (!archive || typeof archive !== 'object') {
    return { valid: false, checksumMatch: false, formatValid: false, errors: ['Fichier invalide'], warnings }
  }

  const record = archive as BackupArchive
  const manifest = record.manifest
  const data = record.data

  if (!manifest || !data) {
    errors.push('Structure archive incomplète (manifest ou data manquant)')
    return { valid: false, checksumMatch: false, formatValid: false, errors, warnings }
  }

  if (manifest.appId !== BACKUP_APP_ID) {
    errors.push('Ce fichier n\'est pas une sauvegarde AT72Manager')
  }

  if (manifest.formatVersion > BACKUP_FORMAT_VERSION) {
    errors.push(`Version format ${manifest.formatVersion} non supportée (max ${BACKUP_FORMAT_VERSION})`)
  }

  if (manifest.formatVersion < BACKUP_FORMAT_VERSION) {
    warnings.push('Ancienne version de format — migration automatique appliquée à l\'import')
  }

  const { checksumSha256, ...manifestWithoutChecksum } = manifest
  const expected = await computeArchiveChecksum({ manifest: manifestWithoutChecksum, data })
  const checksumMatch = checksumSha256 === expected

  if (!checksumMatch) {
    errors.push('Checksum SHA-256 invalide — fichier corrompu ou altéré')
  }

  if (!Array.isArray(data.clients)) warnings.push('Section clients absente ou invalide')

  return {
    valid: errors.length === 0 && checksumMatch,
    checksumMatch,
    formatValid: manifest.appId === BACKUP_APP_ID && manifest.formatVersion <= BACKUP_FORMAT_VERSION,
    errors,
    warnings,
  }
}

export function validateReferentialIntegrity(data: BackupArchive['data']): string[] {
  const warnings: string[] = []
  const clients = data.clients ?? []
  const devices = data.devices ?? []
  const interventions = data.interventions ?? []
  const photos = data.interventionPhotos ?? []

  const clientIds = new Set((clients as Array<{ id: string }>).map((c) => c.id))
  const interventionIds = new Set((interventions as Array<{ id: string }>).map((i) => i.id))

  for (const device of devices as Array<{ clientId?: string }>) {
    if (device.clientId && !clientIds.has(device.clientId)) {
      warnings.push(`Appareil référence client inconnu : ${device.clientId}`)
    }
  }

  for (const intervention of interventions as Array<{ clientId?: string }>) {
    if (intervention.clientId && !clientIds.has(intervention.clientId)) {
      warnings.push(`Intervention référence client inconnu : ${intervention.clientId}`)
    }
  }

  for (const photo of photos as Array<{ interventionId?: string }>) {
    if (photo.interventionId && !interventionIds.has(photo.interventionId)) {
      warnings.push(`Photo référence intervention inconnue : ${photo.interventionId}`)
    }
  }

  return warnings.slice(0, 20)
}
