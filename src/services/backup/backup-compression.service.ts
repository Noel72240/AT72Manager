import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate'
import type { BackupArchive } from '@/services/backup/backup.types'

const ZIP_MANIFEST = 'manifest.json'
const ZIP_DATA = 'data.json'

export function archiveToJsonBlob(archive: BackupArchive): Blob {
  const json = JSON.stringify(archive, null, 2)
  return new Blob([json], { type: 'application/json;charset=utf-8' })
}

export function archiveToZipBlob(archive: BackupArchive): Blob {
  const manifestJson = JSON.stringify(archive.manifest)
  const dataJson = JSON.stringify(archive.data)
  const zipped = zipSync(
    {
      [ZIP_MANIFEST]: strToU8(manifestJson),
      [ZIP_DATA]: strToU8(dataJson),
      'README.txt': strToU8(
        'AT72Manager Backup Archive\nNe modifiez pas ces fichiers manuellement.\n',
      ),
    },
    { level: 6 },
  )
  return new Blob([zipped], { type: 'application/zip' })
}

export function gzipStringToBase64(text: string): string {
  const compressed = zipSync({ 'archive.json': strToU8(text) }, { level: 9 })
  let binary = ''
  for (let i = 0; i < compressed.length; i++) binary += String.fromCharCode(compressed[i]!)
  return btoa(binary)
}

export function gunzipBase64ToString(base64: string): string {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const unzipped = unzipSync(bytes)
  const entry = unzipped['archive.json']
  if (!entry) throw new Error('Payload snapshot corrompu')
  return strFromU8(entry)
}

export function parseBackupJson(text: string): BackupArchive {
  const parsed = JSON.parse(text) as BackupArchive
  if (!parsed.manifest || !parsed.data) {
    throw new Error('JSON de sauvegarde invalide')
  }
  return parsed
}

export async function parseBackupFile(file: File): Promise<BackupArchive> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.zip')) {
    const buffer = new Uint8Array(await file.arrayBuffer())
    const unzipped = unzipSync(buffer)
    const manifestBytes = unzipped[ZIP_MANIFEST]
    const dataBytes = unzipped[ZIP_DATA]
    if (!manifestBytes || !dataBytes) {
      throw new Error('Archive ZIP invalide — fichiers manifest.json / data.json attendus')
    }
    return {
      manifest: JSON.parse(strFromU8(manifestBytes)),
      data: JSON.parse(strFromU8(dataBytes)),
    }
  }
  return parseBackupJson(await file.text())
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`
}

export function buildBackupFilename(format: 'json' | 'zip', label?: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const slug = label ? `-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}` : ''
  return `at72-backup${slug}-${stamp}.${format === 'zip' ? 'zip' : 'json'}`
}
