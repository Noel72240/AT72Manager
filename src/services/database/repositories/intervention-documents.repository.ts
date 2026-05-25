import type {
  InterventionDocument,
  InterventionDocumentEvent,
  InterventionDocumentInsert,
  InterventionDocumentType,
} from '@/types/entities/intervention-document.types'
import { getDb } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import { getSupabaseClient } from '@/services/supabase/client'

function mapDocumentRow(row: Record<string, unknown>): InterventionDocument {
  return {
    id: row.id as string,
    interventionId: row.intervention_id as string,
    clientId: row.client_id as string,
    workshopId: row.workshop_id as string,
    deviceId: (row.device_id as string | null) ?? undefined,
    type: row.type as InterventionDocumentType,
    fileName: row.file_name as string,
    storagePath: row.storage_path as string,
    mimeType: row.mime_type as string,
    size: Number(row.size) || 0,
    uploadedBy: row.uploaded_by as string,
    deletedAt: (row.deleted_at as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    syncStatus: 'synced',
  }
}

function mapEventRow(row: Record<string, unknown>): InterventionDocumentEvent {
  return {
    id: row.id as string,
    documentId: (row.document_id as string | null) ?? undefined,
    interventionId: row.intervention_id as string,
    clientId: row.client_id as string,
    workshopId: row.workshop_id as string,
    eventType: row.event_type as InterventionDocumentEvent['eventType'],
    actorType: row.actor_type as InterventionDocumentEvent['actorType'],
    actorId: row.actor_id as string,
    metadata: (row.metadata as Record<string, unknown>) ?? undefined,
    createdAt: row.created_at as string,
  }
}

function documentToRow(
  doc: InterventionDocumentInsert & { id: string; createdAt?: string; updatedAt?: string },
): Record<string, unknown> {
  const now = new Date().toISOString()
  return {
    id: doc.id,
    intervention_id: doc.interventionId,
    client_id: doc.clientId,
    workshop_id: doc.workshopId,
    device_id: doc.deviceId ?? null,
    type: doc.type,
    file_name: doc.fileName,
    storage_path: doc.storagePath,
    mime_type: doc.mimeType,
    size: doc.size,
    uploaded_by: doc.uploadedBy,
    deleted_at: doc.deletedAt ?? null,
    created_at: doc.createdAt ?? now,
    updated_at: doc.updatedAt ?? now,
  }
}

export const interventionDocumentsRepository = {
  async listLocalByIntervention(interventionId: string): Promise<InterventionDocument[]> {
    const db = await getDb()
    const rows = await db.getAllFromIndex(
      STORES.interventionDocuments,
      'by-intervention',
      interventionId,
    )
    return rows.filter((row) => !row.deletedAt)
  },

  async listLocalByClient(clientId: string): Promise<InterventionDocument[]> {
    const db = await getDb()
    const all = await db.getAll(STORES.interventionDocuments)
    return all.filter((row) => row.clientId === clientId && !row.deletedAt)
  },

  async upsertLocal(doc: InterventionDocument): Promise<void> {
    const db = await getDb()
    await db.put(STORES.interventionDocuments, doc)
  },

  async removeLocal(id: string): Promise<void> {
    const db = await getDb()
    await db.delete(STORES.interventionDocuments, id)
    await db.delete(STORES.interventionDocumentBlobs, id)
  },

  async saveBlob(id: string, dataUrl: string): Promise<void> {
    const db = await getDb()
    await db.put(STORES.interventionDocumentBlobs, { id, dataUrl })
  },

  async getBlob(id: string): Promise<string | undefined> {
    const db = await getDb()
    const row = await db.get(STORES.interventionDocumentBlobs, id)
    return row?.dataUrl
  },

  async listEventsLocal(interventionId: string): Promise<InterventionDocumentEvent[]> {
    const db = await getDb()
    const rows = await db.getAllFromIndex(
      STORES.interventionDocumentEvents,
      'by-intervention',
      interventionId,
    )
    return rows.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  },

  async addEventLocal(event: InterventionDocumentEvent): Promise<void> {
    const db = await getDb()
    await db.put(STORES.interventionDocumentEvents, event)
  },

  async listByIntervention(interventionId: string): Promise<InterventionDocument[]> {
    const local = await this.listLocalByIntervention(interventionId)
    const db = getSupabaseClient()
    if (!db) return local

    const { data, error } = await db
      .from('intervention_documents' as never)
      .select('*')
      .eq('intervention_id', interventionId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[documents] fetch remote failed', error)
      return local
    }

    const remote = (data ?? []).map((row) =>
      mapDocumentRow(row as Record<string, unknown>),
    )
    const merged = new Map<string, InterventionDocument>()
    for (const doc of remote) merged.set(doc.id, doc)
    for (const doc of local) {
      if (!merged.has(doc.id) || doc.syncStatus !== 'synced') merged.set(doc.id, doc)
    }
    await Promise.all(Array.from(merged.values()).map((doc) => this.upsertLocal(doc)))
    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  },

  async listByClient(clientId: string): Promise<InterventionDocument[]> {
    const db = getSupabaseClient()
    if (!db) return this.listLocalByClient(clientId)

    const { data, error } = await db
      .from('intervention_documents' as never)
      .select('*')
      .eq('client_id', clientId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
  return (data ?? []).map((row) => mapDocumentRow(row as Record<string, unknown>))
  },

  async insertRemote(doc: InterventionDocumentInsert & { id: string }): Promise<InterventionDocument> {
    const db = getSupabaseClient()
    if (!db) throw new Error('Supabase indisponible')

    const row = documentToRow(doc)
    const { data, error } = await db
      .from('intervention_documents' as never)
      .insert(row as never)
      .select('*')
      .single()

    if (error) throw error
    return mapDocumentRow(data as Record<string, unknown>)
  },

  async softDeleteRemote(id: string): Promise<void> {
    const db = getSupabaseClient()
    if (!db) throw new Error('Supabase indisponible')

    const { error } = await db
      .from('intervention_documents' as never)
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq('id', id)

    if (error) throw error
  },

  async insertEventRemote(
    event: Omit<InterventionDocumentEvent, 'id' | 'createdAt'>,
  ): Promise<InterventionDocumentEvent> {
    const db = getSupabaseClient()
    if (!db) throw new Error('Supabase indisponible')

    const payload = {
      document_id: event.documentId ?? null,
      intervention_id: event.interventionId,
      client_id: event.clientId,
      workshop_id: event.workshopId,
      event_type: event.eventType,
      actor_type: event.actorType,
      actor_id: event.actorId,
      metadata: event.metadata ?? {},
    }

    const { data, error } = await db
      .from('intervention_document_events' as never)
      .insert(payload as never)
      .select('*')
      .single()

    if (error) throw error
    return mapEventRow(data as Record<string, unknown>)
  },

  async listEventsRemote(interventionId: string): Promise<InterventionDocumentEvent[]> {
    const db = getSupabaseClient()
    if (!db) return this.listEventsLocal(interventionId)

    const { data, error } = await db
      .from('intervention_document_events' as never)
      .select('*')
      .eq('intervention_id', interventionId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return (data ?? []).map((row) => mapEventRow(row as Record<string, unknown>))
  },

  async upsertEngagement(params: {
    documentId: string
    clientId: string
    markViewed?: boolean
    markDownloaded?: boolean
  }): Promise<void> {
    const db = getSupabaseClient()
    if (!db) return

    const now = new Date().toISOString()
    const { data: existing } = await db
      .from('portal_document_engagement' as never)
      .select('*')
      .eq('document_id', params.documentId)
      .eq('client_id', params.clientId)
      .maybeSingle()

    const row = existing as Record<string, unknown> | null
    const patch: Record<string, unknown> = {
      document_id: params.documentId,
      client_id: params.clientId,
      updated_at: now,
    }
    if (params.markViewed && !row?.first_viewed_at) patch.first_viewed_at = now
    if (params.markDownloaded) patch.downloaded_at = now
    if (row?.first_viewed_at && params.markViewed) patch.first_viewed_at = row.first_viewed_at
    if (row?.downloaded_at && !params.markDownloaded) patch.downloaded_at = row.downloaded_at

    if (row?.id) {
      await db
        .from('portal_document_engagement' as never)
        .update(patch as never)
        .eq('id', row.id as string)
    } else {
      await db.from('portal_document_engagement' as never).insert({
        ...patch,
        first_viewed_at: params.markViewed ? now : null,
        downloaded_at: params.markDownloaded ? now : null,
      } as never)
    }
  },

  async listEngagements(clientId: string): Promise<
    Array<{ documentId: string; firstViewedAt?: string; downloadedAt?: string }>
  > {
    const db = getSupabaseClient()
    if (!db) return []

    const { data } = await db
      .from('portal_document_engagement' as never)
      .select('document_id, first_viewed_at, downloaded_at')
      .eq('client_id', clientId)

    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>
      return {
        documentId: r.document_id as string,
        firstViewedAt: (r.first_viewed_at as string | null) ?? undefined,
        downloadedAt: (r.downloaded_at as string | null) ?? undefined,
      }
    })
  },
}
