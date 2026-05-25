import type {
  Intervention,
  InterventionInsert,
  InterventionMedia,
  InterventionUpdate,
} from '@/types/entities'
import { normalizeInterventionStatus, normalizeInterventionPriority } from '@/modules/interventions/utils/intervention-labels'
import { normalizeInterventionMedia } from '@/modules/interventions/field/utils/media-utils'
import { mergeInterventionMedia } from '@/modules/interventions/field/utils/media-merge'
import { photoDebug } from '@/modules/interventions/field/utils/photo-debug'
import {
  deletePhotosForIntervention,
  hydrateInterventionMedia,
  hydrateInterventions,
  persistInterventionPhotos,
} from '@/modules/interventions/field/services/intervention-photo-storage.service'
import { getDb } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import { databaseService } from '@/services/database/database.service'
import { syncService } from '@/services/sync/sync.service'
import { parseLines, serializeLines } from '@/services/database/repositories/commercial-map'

function parsePrice(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : undefined
}

function parseMedia(value: unknown): InterventionMedia | undefined {
  if (!value || typeof value !== 'object') return undefined
  return normalizeInterventionMedia(value as InterventionMedia)
}

function mapRow(row: Record<string, unknown>): Intervention {
  const reportedIssue =
    (row.reported_issue as string | null) ||
    (row.title as string | null) ||
    ''

  return {
    id: row.id as string,
    clientId: row.client_id as string,
    deviceId: (row.device_id as string | null) ?? undefined,
    deviceLabel: (row.device_label as string | null) ?? undefined,
    brand: (row.brand as string | null) ?? undefined,
    model: (row.model as string | null) ?? undefined,
    imeiOrSerial: (row.imei_or_serial as string | null) ?? undefined,
    reportedIssue,
    diagnostic: (row.diagnostic as string | null) ?? undefined,
    technicianNotes:
      (row.technician_notes as string | null) ??
      (row.description as string | null) ??
      undefined,
    status: normalizeInterventionStatus((row.status as string) ?? 'diagnostic'),
    scheduledAt: (row.scheduled_at as string | null) ?? undefined,
    completedAt: (row.completed_at as string | null) ?? undefined,
    priority: normalizeInterventionPriority(row.priority as string | null),
    durationMinutes: Number(row.duration_minutes) || 60,
    assignedTechnicianId: (row.assigned_technician_id as string | null) ?? undefined,
    estimatedPrice: parsePrice(row.estimated_price),
    finalPrice: parsePrice(row.final_price),
    media: parseMedia(row.media),
    partsLines: parseLines(row.parts_lines),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    userId: row.user_id as string,
  }
}

async function prepareMediaForSave(
  interventionId: string,
  media?: InterventionMedia,
): Promise<InterventionMedia | undefined> {
  const normalized = normalizeInterventionMedia(media)
  const photos = normalized.photos ?? []

  if (photos.length === 0) {
    await deletePhotosForIntervention(interventionId)
    return normalized
  }

  const persistedPhotos = await persistInterventionPhotos(interventionId, photos)
  return {
    ...normalized,
    photos: persistedPhotos,
  }
}

async function upsertLocalMerged(intervention: Intervention): Promise<Intervention> {
  const db = await getDb()
  const existing = await db.get(STORES.interventions, intervention.id)

  const mergedMedia = mergeInterventionMedia(existing?.media, intervention.media)
  const withMedia: Intervention = {
    ...intervention,
    media: await prepareMediaForSave(intervention.id, mergedMedia),
  }

  await db.put(STORES.interventions, withMedia)
  photoDebug.log('Intervention sauvegardée localement', {
    id: withMedia.id,
    photos: withMedia.media?.photos?.length ?? 0,
  })

  return hydrateInterventionMedia(withMedia)
}

function buildInsertRow(payload: InterventionInsert): Record<string, unknown> {
  return {
    client_id: payload.clientId,
    device_id: payload.deviceId ?? null,
    device_label: payload.deviceLabel ?? null,
    brand: payload.brand ?? null,
    model: payload.model ?? null,
    imei_or_serial: payload.imeiOrSerial ?? null,
    reported_issue: payload.reportedIssue,
    diagnostic: payload.diagnostic ?? null,
    technician_notes: payload.technicianNotes ?? null,
    status: payload.status,
    estimated_price: payload.estimatedPrice ?? null,
    final_price: payload.finalPrice ?? null,
    media: payload.media ?? {},
    parts_lines: payload.partsLines ?? [],
    title: payload.reportedIssue,
    description: payload.technicianNotes ?? null,
    priority: payload.priority ?? 'medium',
    scheduled_at: payload.scheduledAt ?? null,
    completed_at: payload.completedAt ?? null,
    duration_minutes: payload.durationMinutes ?? 60,
    assigned_technician_id: payload.assignedTechnicianId ?? null,
    user_id: payload.userId,
  }
}

function mapToRow(payload: InterventionInsert | InterventionUpdate): Record<string, unknown> {
  const row: Record<string, unknown> = {}

  if ('clientId' in payload && payload.clientId !== undefined) row.client_id = payload.clientId
  if ('deviceId' in payload && payload.deviceId !== undefined) row.device_id = payload.deviceId ?? null
  if ('deviceLabel' in payload && payload.deviceLabel !== undefined) {
    row.device_label = payload.deviceLabel || null
  }
  if ('brand' in payload && payload.brand !== undefined) row.brand = payload.brand || null
  if ('model' in payload && payload.model !== undefined) row.model = payload.model || null
  if ('imeiOrSerial' in payload && payload.imeiOrSerial !== undefined) {
    row.imei_or_serial = payload.imeiOrSerial || null
  }
  if ('reportedIssue' in payload && payload.reportedIssue !== undefined) {
    row.reported_issue = payload.reportedIssue
    row.title = payload.reportedIssue
  }
  if ('diagnostic' in payload && payload.diagnostic !== undefined) {
    row.diagnostic = payload.diagnostic || null
  }
  if ('technicianNotes' in payload && payload.technicianNotes !== undefined) {
    row.technician_notes = payload.technicianNotes || null
    row.description = payload.technicianNotes || null
  }
  if ('status' in payload && payload.status !== undefined) row.status = payload.status
  if ('scheduledAt' in payload && payload.scheduledAt !== undefined) {
    row.scheduled_at = payload.scheduledAt || null
  }
  if ('completedAt' in payload && payload.completedAt !== undefined) {
    row.completed_at = payload.completedAt || null
  }
  if ('priority' in payload && payload.priority !== undefined) row.priority = payload.priority
  if ('durationMinutes' in payload && payload.durationMinutes !== undefined) {
    row.duration_minutes = payload.durationMinutes
  }
  if ('assignedTechnicianId' in payload && payload.assignedTechnicianId !== undefined) {
    row.assigned_technician_id = payload.assignedTechnicianId || null
  }
  if ('estimatedPrice' in payload && payload.estimatedPrice !== undefined) {
    row.estimated_price = payload.estimatedPrice ?? null
  }
  if ('finalPrice' in payload && payload.finalPrice !== undefined) {
    row.final_price = payload.finalPrice ?? null
  }
  if ('media' in payload && payload.media !== undefined) {
    row.media = payload.media
  }
  if ('partsLines' in payload && payload.partsLines !== undefined) {
    row.parts_lines = serializeLines(payload.partsLines)
  }
  if ('userId' in payload && payload.userId !== undefined) row.user_id = payload.userId

  return row
}

export const interventionsRepository = {
  async listLocal(): Promise<Intervention[]> {
    const db = await getDb()
    const items = await db.getAll(STORES.interventions)
    return hydrateInterventions(items)
  },

  async getLocal(id: string): Promise<Intervention | undefined> {
    const db = await getDb()
    const item = await db.get(STORES.interventions, id)
    if (!item) return undefined
    return hydrateInterventionMedia(item)
  },

  async upsertLocal(intervention: Intervention): Promise<Intervention> {
    return upsertLocalMerged(intervention)
  },

  async removeLocal(id: string): Promise<void> {
    const db = await getDb()
    await deletePhotosForIntervention(id)
    await db.delete(STORES.interventions, id)
  },

  async list(): Promise<Intervention[]> {
    if (!databaseService.isAvailable()) {
      return this.listLocal()
    }

    const rows = await databaseService.list('interventions')
    const hydrated: Intervention[] = []

    for (const row of rows) {
      const remote = mapRow(row as Record<string, unknown>)
      const local = await this.getLocal(remote.id)
      const merged: Intervention = {
        ...remote,
        media: mergeInterventionMedia(local?.media, remote.media),
      }
      const saved = await upsertLocalMerged(merged)
      hydrated.push(saved)
    }

    return hydrated
  },

  async getById(id: string): Promise<Intervention | null> {
    const local = await this.getLocal(id)
    if (!databaseService.isAvailable()) {
      return local ?? null
    }

    try {
      const data = await databaseService.getById('interventions', id)
      const remote = mapRow(data as Record<string, unknown>)
      const merged: Intervention = {
        ...remote,
        media: mergeInterventionMedia(local?.media, remote.media),
      }
      return upsertLocalMerged(merged)
    } catch {
      return local ?? null
    }
  },

  async create(payload: InterventionInsert): Promise<Intervention> {
    const now = new Date().toISOString()
    const localItem: Intervention = {
      id: crypto.randomUUID(),
      ...payload,
      media: normalizeInterventionMedia(payload.media),
      createdAt: now,
      updatedAt: now,
    }
    const row = { id: localItem.id, ...buildInsertRow({ ...payload, media: localItem.media }) }

    let saved = await upsertLocalMerged(localItem)

    if (!databaseService.isAvailable()) {
      await syncService.enqueue({
        entity: 'interventions',
        action: 'create',
        entityId: localItem.id,
        payload: row,
      })
      return saved
    }

    try {
      const created = await databaseService.insert('interventions', row)
      const remote = mapRow(created as Record<string, unknown>)
      saved = await upsertLocalMerged({
        ...remote,
        media: mergeInterventionMedia(saved.media, remote.media),
      })
    } catch (error) {
      photoDebug.error('Sync Supabase create échouée, données locales conservées', error)
      await syncService.enqueue({
        entity: 'interventions',
        action: 'create',
        entityId: localItem.id,
        payload: row,
      })
    }

    return saved
  },

  async update(id: string, payload: InterventionUpdate): Promise<Intervention> {
    const existing = (await this.getLocal(id)) ?? (await this.getById(id))
    if (!existing) {
      throw new Error('Intervention introuvable.')
    }

    const mergedMedia =
      payload.media !== undefined
        ? mergeInterventionMedia(existing.media, payload.media)
        : existing.media

    const row = mapToRow({ ...payload, media: mergedMedia })
    const now = new Date().toISOString()
    row.updated_at = now

    const updated: Intervention = {
      ...existing,
      ...payload,
      media: mergedMedia,
      updatedAt: now,
    }

    let saved = await upsertLocalMerged(updated)

    if (!databaseService.isAvailable()) {
      await syncService.enqueue({
        entity: 'interventions',
        action: 'update',
        entityId: id,
        payload: row,
      })
      return saved
    }

    try {
      const result = await databaseService.update('interventions', id, row)
      const remote = mapRow(result as Record<string, unknown>)
      saved = await upsertLocalMerged({
        ...saved,
        ...remote,
        media: mergeInterventionMedia(saved.media, remote.media),
      })
    } catch (error) {
      photoDebug.error('Sync Supabase update échouée, données locales conservées', error)
      await syncService.enqueue({
        entity: 'interventions',
        action: 'update',
        entityId: id,
        payload: row,
      })
    }

    return saved
  },

  async remove(id: string): Promise<void> {
    await this.removeLocal(id)

    if (!databaseService.isAvailable()) {
      await syncService.enqueue({
        entity: 'interventions',
        action: 'delete',
        entityId: id,
        payload: { id },
      })
      return
    }

    await databaseService.remove('interventions', id)
  },
}
