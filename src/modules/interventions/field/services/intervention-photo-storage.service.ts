import type { Intervention, InterventionPhoto } from '@/types/entities/intervention.types'
import { getDb } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import { normalizeInterventionMedia } from '@/modules/interventions/field/utils/media-utils'
import { photoDebug } from '@/modules/interventions/field/utils/photo-debug'

export type StoredInterventionPhoto = {
  id: string
  interventionId: string
  name: string
  dataUrl: string
  createdAt: string
  syncStatus?: InterventionPhoto['syncStatus']
}

export async function persistInterventionPhotos(
  interventionId: string,
  photos: InterventionPhoto[],
): Promise<InterventionPhoto[]> {
  const db = await getDb()
  const saved: InterventionPhoto[] = []

  for (const photo of photos) {
    if (!photo.dataUrl?.startsWith('data:image')) {
      photoDebug.warn('Photo non persistée (dataUrl manquant)', photo.id)
      continue
    }

    const record: StoredInterventionPhoto = {
      id: photo.id,
      interventionId,
      name: photo.name,
      dataUrl: photo.dataUrl,
      createdAt: photo.createdAt,
      syncStatus: photo.syncStatus ?? 'local',
    }

    await db.put(STORES.interventionPhotos, record)
    saved.push({ ...photo, syncStatus: photo.syncStatus ?? 'local' })
  }

  const existing = await db.getAllFromIndex(STORES.interventionPhotos, 'by-intervention', interventionId)
  const keepIds = new Set(saved.map((p) => p.id))
  for (const row of existing) {
    if (!keepIds.has(row.id)) {
      await db.delete(STORES.interventionPhotos, row.id)
      photoDebug.log('Photo orpheline supprimée', row.id)
    }
  }

  photoDebug.log('Photos IndexedDB', { interventionId, count: saved.length })
  return saved
}

export async function loadPhotosForIntervention(interventionId: string): Promise<InterventionPhoto[]> {
  const db = await getDb()
  const rows = await db.getAllFromIndex(STORES.interventionPhotos, 'by-intervention', interventionId)
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    dataUrl: row.dataUrl,
    createdAt: row.createdAt,
    syncStatus: row.syncStatus,
  }))
}

export async function hydrateInterventionMedia(
  intervention: Intervention,
): Promise<Intervention> {
  const media = normalizeInterventionMedia(intervention.media)
  const storedPhotos = await loadPhotosForIntervention(intervention.id)

  if (storedPhotos.length === 0) {
    return { ...intervention, media }
  }

  const inlineById = new Map((media.photos ?? []).map((p) => [p.id, p]))
  const merged = storedPhotos.map((stored) => {
    const inline = inlineById.get(stored.id)
    return {
      ...stored,
      name: inline?.name ?? stored.name,
      dataUrl: stored.dataUrl || inline?.dataUrl || '',
      syncStatus: stored.syncStatus ?? inline?.syncStatus,
    }
  })

  for (const inline of media.photos ?? []) {
    if (!merged.some((p) => p.id === inline.id) && inline.dataUrl?.startsWith('data:image')) {
      merged.push({
        ...inline,
        syncStatus: inline.syncStatus ?? 'local',
      })
    }
  }

  photoDebug.log('Hydratation photos', {
    interventionId: intervention.id,
    stored: storedPhotos.length,
    merged: merged.length,
  })

  return {
    ...intervention,
    media: {
      ...media,
      photos: merged,
    },
  }
}

export async function hydrateInterventions(interventions: Intervention[]): Promise<Intervention[]> {
  return Promise.all(interventions.map((item) => hydrateInterventionMedia(item)))
}

export async function deletePhotosForIntervention(interventionId: string): Promise<void> {
  const db = await getDb()
  const rows = await db.getAllFromIndex(STORES.interventionPhotos, 'by-intervention', interventionId)
  await Promise.all(rows.map((row) => db.delete(STORES.interventionPhotos, row.id)))
}
