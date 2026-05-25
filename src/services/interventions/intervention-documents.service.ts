import type { Intervention } from '@/types/entities'
import type {
  InterventionDocument,
  InterventionDocumentEvent,
  InterventionDocumentType,
  PortalClientDocument,
  PortalDocumentBadge,
} from '@/types/entities/intervention-document.types'
import { legacyKindToDocumentType } from '@/types/entities/intervention-document.types'
import { interventionDocumentsRepository } from '@/services/database/repositories/intervention-documents.repository'
import { documentSettingsService } from '@/services/settings/document-settings.service'
import { portalInviteService } from '@/services/portal/portal-invite.service'
import { auditService } from '@/services/audit/audit.service'
import { securityLogService } from '@/services/audit/security-log.service'
import { extractErrorMessage } from '@/utils/format-supabase-error'
import { ensureSupabaseClient, getSupabaseClient } from '@/services/supabase/client'
import type { InterventionDocumentInsert } from '@/types/entities/intervention-document.types'

export const AT72_DOCUMENTS_BUCKET = 'at72-documents'
/** @deprecated Ancien bucket — fallback lecture legacy */
export const LEGACY_DOCUMENTS_BUCKET = 'intervention-documents'

export type UploadDocumentParams = {
  file: File
  type: InterventionDocumentType
  intervention: Pick<
    Intervention,
    'id' | 'clientId' | 'deviceId' | 'deviceLabel' | 'reportedIssue'
  >
  workshopId: string
  userId: string
  actorName: string
  notifyClient?: boolean
  onProgress?: (percent: number) => void
}

export type PendingDocumentUpload = {
  file: File
  type: InterventionDocumentType
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, '_').slice(0, 120)
}

export function buildDocumentStoragePath(params: {
  workshopId: string
  clientId: string
  interventionId: string
  documentId: string
  fileName: string
}): string {
  const safeName = sanitizeFileName(params.fileName)
  return `${params.workshopId}/${params.clientId}/${params.interventionId}/${params.documentId}/${safeName}`
}

function buildLegacyStoragePath(clientId: string, interventionId: string, documentId: string): string {
  return `${clientId}/${interventionId}/${documentId}.pdf`
}

async function uploadFileToStorage(
  db: NonNullable<ReturnType<typeof getSupabaseClient>>,
  primaryPath: string,
  file: File,
  legacyPath: string,
): Promise<string> {
  const buckets: Array<{ bucket: string; path: string }> = [
    { bucket: AT72_DOCUMENTS_BUCKET, path: primaryPath },
    { bucket: LEGACY_DOCUMENTS_BUCKET, path: legacyPath },
  ]

  let lastError: unknown = new Error('Upload Storage impossible.')

  for (const { bucket, path } of buckets) {
    const { error } = await db.storage.from(bucket).upload(path, file, {
      contentType: file.type || 'application/pdf',
      upsert: true,
    })

    if (!error) return path

    lastError = error
    const msg = extractErrorMessage(error).toLowerCase()
    if (!msg.includes('bucket not found') && !msg.includes('not found')) {
      break
    }
  }

  throw lastError
}

async function ensureRemoteDocumentRow(
  doc: InterventionDocumentInsert & { id: string },
): Promise<void> {
  try {
    await interventionDocumentsRepository.insertRemote(doc)
  } catch (error) {
    const msg = extractErrorMessage(error).toLowerCase()
    if (
      msg.includes('duplicate') ||
      msg.includes('unique constraint') ||
      msg.includes('already exists')
    ) {
      return
    }
    throw error
  }
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Lecture fichier impossible'))
    reader.readAsDataURL(file)
  })
}

function computeBadge(
  _doc: InterventionDocument,
  engagement?: { firstViewedAt?: string; downloadedAt?: string },
): PortalDocumentBadge {
  if (engagement?.downloadedAt) return 'downloaded'
  if (engagement?.firstViewedAt) return 'read'
  return 'new'
}

export const interventionDocumentsService = {
  async validateFile(file: File): Promise<void> {
    const maxBytes = await documentSettingsService.getMaxSizeBytes()
    const allowed = documentSettingsService.getAllowedMimeTypes()

    if (!allowed.includes(file.type)) {
      throw new Error(`Type de fichier non autorisé (${file.type || 'inconnu'}).`)
    }
    if (file.size <= 0) throw new Error('Fichier vide.')
    if (file.size > maxBytes) {
      const mb = Math.round(maxBytes / (1024 * 1024))
      throw new Error(`Fichier trop volumineux (max ${mb} Mo).`)
    }

    const dangerous = ['.exe', '.bat', '.cmd', '.sh', '.js', '.html', '.htm']
    const lower = file.name.toLowerCase()
    if (dangerous.some((ext) => lower.endsWith(ext))) {
      throw new Error('Extension de fichier non autorisée.')
    }
  },

  async listForIntervention(interventionId: string): Promise<InterventionDocument[]> {
    return interventionDocumentsRepository.listByIntervention(interventionId)
  },

  async listEvents(interventionId: string): Promise<InterventionDocumentEvent[]> {
    try {
      return await interventionDocumentsRepository.listEventsRemote(interventionId)
    } catch {
      return interventionDocumentsRepository.listEventsLocal(interventionId)
    }
  },

  async upload(params: UploadDocumentParams): Promise<InterventionDocument> {
    await this.validateFile(params.file)
    await ensureSupabaseClient()

    const docId = crypto.randomUUID()
    const now = new Date().toISOString()
    const storagePath = buildDocumentStoragePath({
      workshopId: params.workshopId,
      clientId: params.intervention.clientId,
      interventionId: params.intervention.id,
      documentId: docId,
      fileName: params.file.name,
    })

    params.onProgress?.(5)

    const localDoc: InterventionDocument = {
      id: docId,
      interventionId: params.intervention.id,
      clientId: params.intervention.clientId,
      workshopId: params.workshopId,
      deviceId: params.intervention.deviceId,
      type: params.type,
      fileName: params.file.name,
      storagePath,
      mimeType: params.file.type,
      size: params.file.size,
      uploadedBy: params.userId,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    }

    const dataUrl = await fileToDataUrl(params.file)
    await interventionDocumentsRepository.saveBlob(docId, dataUrl)
    await interventionDocumentsRepository.upsertLocal({
      ...localDoc,
      localDataUrl: dataUrl,
    })

    params.onProgress?.(15)

    const db = getSupabaseClient()
    if (!db) {
      await interventionDocumentsRepository.upsertLocal({
        ...localDoc,
        syncStatus: 'local',
        localDataUrl: dataUrl,
      })
      return localDoc
    }

    try {
      await ensureRemoteDocumentRow({
        id: docId,
        interventionId: params.intervention.id,
        clientId: params.intervention.clientId,
        workshopId: params.workshopId,
        deviceId: params.intervention.deviceId,
        type: params.type,
        fileName: params.file.name,
        storagePath,
        mimeType: params.file.type,
        size: params.file.size,
        uploadedBy: params.userId,
      })

      params.onProgress?.(40)

      const legacyPath = buildLegacyStoragePath(
        params.intervention.clientId,
        params.intervention.id,
        docId,
      )
      const finalStoragePath = await uploadFileToStorage(db, storagePath, params.file, legacyPath)

      params.onProgress?.(90)

      const saved: InterventionDocument = {
        ...localDoc,
        storagePath: finalStoragePath,
        syncStatus: 'synced',
      }
      await interventionDocumentsRepository.upsertLocal(saved)

      await this.recordEvent({
        documentId: docId,
        interventionId: params.intervention.id,
        clientId: params.intervention.clientId,
        workshopId: params.workshopId,
        eventType: 'uploaded',
        actorType: 'workshop',
        actorId: params.userId,
        metadata: { fileName: params.file.name, type: params.type },
      })

      await auditService.log({
        workshopId: params.workshopId,
        actorId: params.userId,
        actorName: params.actorName,
        action: 'create',
        resource: 'document',
        resourceId: docId,
        summary: `Document ${params.type} ajouté — ${params.file.name}`,
        metadata: { interventionId: params.intervention.id, storagePath },
      })

      if (params.notifyClient) {
        const isQuote = params.type === 'quote'
        const isInvoice = params.type === 'invoice'
        if (isQuote || isInvoice) {
          await portalInviteService.notifyClient({
            clientId: params.intervention.clientId,
            workshopId: params.workshopId,
            kind: isQuote ? 'quote_ready' : 'invoice_ready',
            title: isQuote ? 'Nouveau devis disponible' : 'Nouvelle facture disponible',
            body: isQuote
              ? 'Consultez votre devis dans « Mes documents ».'
              : 'Consultez votre facture dans « Mes documents ».',
            metadata: {
              interventionId: params.intervention.id,
              documentId: docId,
              type: params.type,
            },
          })
        }
      }

      params.onProgress?.(100)
      return saved
    } catch (error) {
      const message = extractErrorMessage(error)
      await interventionDocumentsRepository.upsertLocal({
        ...localDoc,
        syncStatus: 'error',
        uploadError: message,
        localDataUrl: dataUrl,
      })
      throw new Error(message)
    }
  },

  async retryUpload(
    doc: InterventionDocument,
    actor: { userId: string; actorName: string },
  ): Promise<InterventionDocument> {
    const dataUrl = doc.localDataUrl ?? (await interventionDocumentsRepository.getBlob(doc.id))
    if (!dataUrl) throw new Error('Fichier local introuvable — réimportez le document.')

    await ensureSupabaseClient()
    const db = getSupabaseClient()
    if (!db) throw new Error('Connexion Supabase requise pour synchroniser le document.')

    const blob = await fetch(dataUrl).then((r) => r.blob())
    const file = new File([blob], doc.fileName, { type: doc.mimeType || 'application/pdf' })

    await ensureRemoteDocumentRow({
      id: doc.id,
      interventionId: doc.interventionId,
      clientId: doc.clientId,
      workshopId: doc.workshopId,
      deviceId: doc.deviceId,
      type: doc.type,
      fileName: doc.fileName,
      storagePath: doc.storagePath,
      mimeType: doc.mimeType,
      size: doc.size,
      uploadedBy: doc.uploadedBy,
    })

    const legacyPath = buildLegacyStoragePath(doc.clientId, doc.interventionId, doc.id)
    const finalStoragePath = await uploadFileToStorage(db, doc.storagePath, file, legacyPath)

    const saved: InterventionDocument = {
      ...doc,
      storagePath: finalStoragePath,
      syncStatus: 'synced',
      uploadError: undefined,
    }
    await interventionDocumentsRepository.upsertLocal(saved)

    await this.recordEvent({
      documentId: doc.id,
      interventionId: doc.interventionId,
      clientId: doc.clientId,
      workshopId: doc.workshopId,
      eventType: 'uploaded',
      actorType: 'workshop',
      actorId: actor.userId,
      metadata: { fileName: doc.fileName, retry: true },
    })

    return saved
  },

  async softDelete(
    doc: InterventionDocument,
    actor: { userId: string; actorName: string; workshopId: string },
  ): Promise<void> {
    const db = getSupabaseClient()
    if (db) {
      try {
        await interventionDocumentsRepository.softDeleteRemote(doc.id)
      } catch (error) {
        console.warn('[documents] soft delete remote failed', error)
      }
    }

    await interventionDocumentsRepository.upsertLocal({
      ...doc,
      deletedAt: new Date().toISOString(),
      syncStatus: doc.syncStatus === 'synced' ? 'synced' : 'local',
    })

    await this.recordEvent({
      documentId: doc.id,
      interventionId: doc.interventionId,
      clientId: doc.clientId,
      workshopId: doc.workshopId,
      eventType: 'deleted',
      actorType: 'workshop',
      actorId: actor.userId,
      metadata: { fileName: doc.fileName },
    })

    await auditService.log({
      workshopId: actor.workshopId,
      actorId: actor.userId,
      actorName: actor.actorName,
      action: 'delete',
      resource: 'document',
      resourceId: doc.id,
      summary: `Document supprimé — ${doc.fileName}`,
    })
  },

  async getSignedDownloadUrl(
    doc: InterventionDocument,
    options?: { actorType?: 'workshop' | 'client'; actorId?: string; clientId?: string },
  ): Promise<string | null> {
    const db = getSupabaseClient()
    if (!db) {
      if (doc.localDataUrl) return doc.localDataUrl
      const blob = await interventionDocumentsRepository.getBlob(doc.id)
      return blob ?? null
    }

    const ttl = documentSettingsService.getSignedUrlTtlSeconds()

    for (const bucket of [AT72_DOCUMENTS_BUCKET, LEGACY_DOCUMENTS_BUCKET]) {
      const { data, error } = await db.storage
        .from(bucket)
        .createSignedUrl(doc.storagePath, ttl)

      if (!error && data?.signedUrl) {
        if (options?.actorType === 'client' && options.clientId && options.actorId) {
          await interventionDocumentsRepository.upsertEngagement({
            documentId: doc.id,
            clientId: options.clientId,
            markDownloaded: true,
          })
          await this.recordEvent({
            documentId: doc.id,
            interventionId: doc.interventionId,
            clientId: doc.clientId,
            workshopId: doc.workshopId,
            eventType: 'downloaded',
            actorType: 'client',
            actorId: options.actorId,
          })
        }
        return data.signedUrl
      }
    }

    if (options?.actorType === 'client') {
      await securityLogService.log({
        workshopId: doc.workshopId,
        userId: options.actorId,
        eventType: 'document_download_denied',
        severity: 'warning',
        message: `Accès document refusé — ${doc.id}`,
        metadata: { storagePath: doc.storagePath, clientId: options.clientId },
      })
    }

    return doc.localDataUrl ?? (await interventionDocumentsRepository.getBlob(doc.id)) ?? null
  },

  async copySignedLink(doc: InterventionDocument): Promise<string> {
    const url = await this.getSignedDownloadUrl(doc, { actorType: 'workshop' })
    if (!url) throw new Error('Lien indisponible')
    await navigator.clipboard.writeText(url)
    return url
  },

  async recordEvent(
    event: Omit<InterventionDocumentEvent, 'id' | 'createdAt'>,
  ): Promise<void> {
    const local: InterventionDocumentEvent = {
      ...event,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    await interventionDocumentsRepository.addEventLocal(local)
    try {
      await interventionDocumentsRepository.insertEventRemote(event)
    } catch {
      /* offline */
    }
  },

  async migrateLegacyMediaDocuments(
    intervention: Intervention,
    workshopId: string,
    userId: string,
    actorName: string,
  ): Promise<void> {
    const legacy = intervention.media?.clientDocuments ?? []
    if (legacy.length === 0) return

    const existing = await this.listForIntervention(intervention.id)
    if (existing.length > 0) return

    for (const item of legacy) {
      if (!item.storagePath) continue
      const now = new Date().toISOString()
      const doc: InterventionDocument = {
        id: item.id,
        interventionId: intervention.id,
        clientId: intervention.clientId,
        workshopId,
        deviceId: intervention.deviceId,
        type: legacyKindToDocumentType(item.kind),
        fileName: item.fileName,
        storagePath: item.storagePath,
        mimeType: 'application/pdf',
        size: 0,
        uploadedBy: userId,
        createdAt: item.uploadedAt ?? now,
        updatedAt: now,
        syncStatus: 'synced',
        localDataUrl: item.dataUrl,
      }
      await interventionDocumentsRepository.upsertLocal(doc)
      if (item.dataUrl) await interventionDocumentsRepository.saveBlob(item.id, item.dataUrl)

      try {
        await interventionDocumentsRepository.insertRemote({
          id: doc.id,
          interventionId: doc.interventionId,
          clientId: doc.clientId,
          workshopId: doc.workshopId,
          deviceId: doc.deviceId,
          type: doc.type,
          fileName: doc.fileName,
          storagePath: doc.storagePath,
          mimeType: doc.mimeType,
          size: doc.size,
          uploadedBy: doc.uploadedBy,
        })
      } catch {
        /* may already exist */
      }

      await auditService.log({
        workshopId,
        actorId: userId,
        actorName,
        action: 'import',
        resource: 'document',
        resourceId: doc.id,
        summary: `Migration document legacy — ${doc.fileName}`,
      })
    }
  },

  async listPortalDocuments(
    clientId: string,
    interventions: Intervention[],
  ): Promise<PortalClientDocument[]> {
    const [docs, engagements] = await Promise.all([
      interventionDocumentsRepository.listByClient(clientId),
      interventionDocumentsRepository.listEngagements(clientId),
    ])

    const engagementMap = new Map(engagements.map((e) => [e.documentId, e]))
    const interventionMap = new Map(interventions.map((i) => [i.id, i]))

    return docs.map((doc) => {
      const intervention = interventionMap.get(doc.interventionId)
      const engagement = engagementMap.get(doc.id)
      return {
        ...doc,
        badge: computeBadge(doc, engagement),
        deviceLabel: intervention?.deviceLabel,
        interventionLabel: intervention?.reportedIssue,
      }
    })
  },

  async markPortalViewed(
    doc: InterventionDocument,
    clientId: string,
    authUserId: string,
  ): Promise<void> {
    await interventionDocumentsRepository.upsertEngagement({
      documentId: doc.id,
      clientId,
      markViewed: true,
    })
    await this.recordEvent({
      documentId: doc.id,
      interventionId: doc.interventionId,
      clientId: doc.clientId,
      workshopId: doc.workshopId,
      eventType: 'viewed',
      actorType: 'client',
      actorId: authUserId,
    })
  },

  async publishPending(
    intervention: Intervention,
    pending: PendingDocumentUpload[],
    options: {
      workshopId: string
      userId: string
      actorName: string
      notifyClient: boolean
      onProgress?: (fileIndex: number, percent: number) => void
    },
  ): Promise<InterventionDocument[]> {
    const results: InterventionDocument[] = []
    for (const [index, item] of pending.entries()) {
      const doc = await this.upload({
        file: item.file,
        type: item.type,
        intervention,
        workshopId: options.workshopId,
        userId: options.userId,
        actorName: options.actorName,
        notifyClient: options.notifyClient,
        onProgress: (p) => options.onProgress?.(index, p),
      })
      results.push(doc)
    }
    return results
  },
}
