import type {
  InterventionClientDocument,
  InterventionMedia,
  InterventionPhoto,
} from '@/types/entities/intervention.types'
import { EMPTY_INTERVENTION_MEDIA } from '@/modules/interventions/field/types/field.types'
import { photoDebug } from '@/modules/interventions/field/utils/photo-debug'

export function normalizeInterventionMedia(raw?: InterventionMedia | null): InterventionMedia {
  if (!raw) return { ...EMPTY_INTERVENTION_MEDIA, photos: [] }

  const photos = normalizePhotos(raw.photos)
  const clientDocuments = normalizeClientDocuments(raw.clientDocuments)

  return {
    ...EMPTY_INTERVENTION_MEDIA,
    ...raw,
    photos,
    clientDocuments,
    clientSignature: raw.clientSignature ?? raw.signatureUrl,
    technicianSignature: raw.technicianSignature,
  }
}

function normalizePhotos(photos?: InterventionPhoto[] | string[] | unknown): InterventionPhoto[] {
  if (!photos || !Array.isArray(photos) || photos.length === 0) return []

  if (typeof photos[0] === 'string') {
    return (photos as string[])
      .filter((url) => typeof url === 'string' && url.startsWith('data:image'))
      .map((dataUrl, index) => ({
        id: `legacy-${index}`,
        name: `Photo ${index + 1}`,
        dataUrl,
        createdAt: new Date().toISOString(),
        syncStatus: 'local' as const,
      }))
  }

  const result: InterventionPhoto[] = []

  for (const [index, entry] of photos.entries()) {
    const photo = normalizePhotoEntry(entry, index)
    if (photo) result.push(photo)
  }

  return result
}

function normalizeClientDocuments(raw?: unknown): InterventionClientDocument[] {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return []

  const result: InterventionClientDocument[] = []
  for (const [index, entry] of raw.entries()) {
    if (!entry || typeof entry !== 'object') continue
    const row = entry as Record<string, unknown>
    const kind = row.kind as InterventionClientDocument['kind']
    if (kind !== 'qonto_quote' && kind !== 'qonto_invoice') continue

    result.push({
      id: String(row.id ?? `doc-${index}`),
      kind,
      fileName: String(row.fileName ?? row.file_name ?? 'document.pdf'),
      storagePath: (row.storagePath ?? row.storage_path) as string | undefined,
      uploadedAt: String(row.uploadedAt ?? row.uploaded_at ?? new Date().toISOString()),
      syncStatus: (row.syncStatus ?? row.sync_status) as InterventionClientDocument['syncStatus'],
      dataUrl: (row.dataUrl ?? row.data_url) as string | undefined,
    })
  }
  return result
}

export function stripClientDocumentsForRemote(
  documents?: InterventionClientDocument[],
): InterventionClientDocument[] | undefined {
  if (!documents?.length) return documents
  return documents.map(({ dataUrl: _dataUrl, ...meta }) => meta)
}

export function sanitizeMediaForRemote(media?: InterventionMedia | null): InterventionMedia | undefined {
  if (!media) return undefined
  const normalized = normalizeInterventionMedia(media)
  return {
    ...normalized,
    clientDocuments: stripClientDocumentsForRemote(normalized.clientDocuments),
  }
}

function normalizePhotoEntry(raw: unknown, index: number): InterventionPhoto | null {
  if (!raw || typeof raw !== 'object') return null

  const row = raw as Record<string, unknown>
  const dataUrl = (row.dataUrl ?? row.data_url) as string | undefined

  if (!dataUrl || !dataUrl.startsWith('data:image')) {
    photoDebug.warn('Photo ignorée (dataUrl invalide)', { index, id: row.id })
    return null
  }

  return {
    id: String(row.id ?? `photo-${index}`),
    name: String(row.name ?? `Photo ${index + 1}`),
    dataUrl,
    createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
    syncStatus: (row.syncStatus ?? row.sync_status ?? 'local') as InterventionPhoto['syncStatus'],
  }
}

export function countMediaItems(media?: InterventionMedia): number {
  const normalized = normalizeInterventionMedia(media)
  let count = (normalized.photos ?? []).filter((p) => p.dataUrl?.startsWith('data:image')).length
  if (normalized.clientSignature) count += 1
  if (normalized.technicianSignature) count += 1
  return count
}

export function cloneInterventionMedia(media: InterventionMedia): InterventionMedia {
  return JSON.parse(JSON.stringify(media)) as InterventionMedia
}
