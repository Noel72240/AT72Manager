import type {
  InterventionClientDocument,
  InterventionMedia,
  InterventionPhoto,
} from '@/types/entities/intervention.types'
import { normalizeInterventionMedia } from '@/modules/interventions/field/utils/media-utils'
import { photoDebug } from '@/modules/interventions/field/utils/photo-debug'

function photoHasData(photo: InterventionPhoto): boolean {
  return Boolean(photo.dataUrl && photo.dataUrl.startsWith('data:image'))
}

function countValidPhotos(media?: InterventionMedia): number {
  return (media?.photos ?? []).filter(photoHasData).length
}

/** Fusionne les médias distants avec le cache local (priorité aux photos complètes) */
export function mergeInterventionMedia(
  local?: InterventionMedia | null,
  remote?: InterventionMedia | null,
): InterventionMedia {
  const localNorm = normalizeInterventionMedia(local)
  const remoteNorm = normalizeInterventionMedia(remote)

  const photoMap = new Map<string, InterventionPhoto>()

  for (const photo of remoteNorm.photos ?? []) {
    if (photo.id) photoMap.set(photo.id, photo)
  }

  for (const photo of localNorm.photos ?? []) {
    const existing = photoMap.get(photo.id)
    if (!existing || (!photoHasData(existing) && photoHasData(photo))) {
      photoMap.set(photo.id, photo)
    } else if (photoHasData(existing) && photoHasData(photo)) {
      photoMap.set(photo.id, photo)
    }
  }

  const mergedPhotos = Array.from(photoMap.values())
  const localCount = countValidPhotos(localNorm)
  const remoteCount = countValidPhotos(remoteNorm)
  const mergedCount = mergedPhotos.filter(photoHasData).length

  if (localCount > remoteCount) {
    photoDebug.log('merge: conservation photos locales', {
      local: localCount,
      remote: remoteCount,
      merged: mergedCount,
    })
  }

  return {
    ...remoteNorm,
    photos: mergedPhotos,
    clientDocuments: mergeClientDocuments(localNorm.clientDocuments, remoteNorm.clientDocuments),
    clientSignature: localNorm.clientSignature || remoteNorm.clientSignature,
    technicianSignature: localNorm.technicianSignature || remoteNorm.technicianSignature,
  }
}

function mergeClientDocuments(
  local?: InterventionClientDocument[],
  remote?: InterventionClientDocument[],
): InterventionClientDocument[] {
  const map = new Map<string, InterventionClientDocument>()

  for (const doc of remote ?? []) {
    if (doc.id) map.set(doc.id, doc)
  }

  for (const doc of local ?? []) {
    const existing = map.get(doc.id)
    if (!existing || (doc.dataUrl && !existing.dataUrl)) {
      map.set(doc.id, doc)
    } else if (doc.storagePath && !existing.storagePath) {
      map.set(doc.id, { ...existing, ...doc })
    }
  }

  return Array.from(map.values())
}
