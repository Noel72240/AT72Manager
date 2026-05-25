/** Types de documents client rattachés à une intervention */
export type InterventionDocumentType = 'quote' | 'invoice' | 'sav_document' | 'attachment'

export type InterventionDocumentSyncStatus = 'local' | 'pending' | 'synced' | 'error'

export type InterventionDocument = {
  id: string
  interventionId: string
  clientId: string
  workshopId: string
  deviceId?: string
  type: InterventionDocumentType
  fileName: string
  storagePath: string
  mimeType: string
  size: number
  uploadedBy: string
  deletedAt?: string
  createdAt: string
  updatedAt: string
  /** IndexedDB / file d'attente offline */
  syncStatus?: InterventionDocumentSyncStatus
  localDataUrl?: string
  uploadError?: string
}

export type InterventionDocumentInsert = Omit<
  InterventionDocument,
  'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'localDataUrl' | 'uploadError'
>

export type InterventionDocumentEventType =
  | 'uploaded'
  | 'deleted'
  | 'downloaded'
  | 'link_copied'
  | 'viewed'

export type InterventionDocumentEvent = {
  id: string
  documentId?: string
  interventionId: string
  clientId: string
  workshopId: string
  eventType: InterventionDocumentEventType
  actorType: 'workshop' | 'client'
  actorId: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export type PortalDocumentEngagement = {
  id: string
  documentId: string
  clientId: string
  firstViewedAt?: string
  downloadedAt?: string
  createdAt: string
  updatedAt: string
}

export type PortalDocumentBadge = 'new' | 'read' | 'downloaded'

export type PortalClientDocument = InterventionDocument & {
  badge: PortalDocumentBadge
  deviceLabel?: string
  interventionLabel?: string
}

export const INTERVENTION_DOCUMENT_TYPE_LABELS: Record<InterventionDocumentType, string> = {
  quote: 'Devis',
  invoice: 'Facture',
  sav_document: 'Document SAV',
  attachment: 'Pièce jointe',
}

export const INTERVENTION_DOCUMENT_EVENT_LABELS: Record<InterventionDocumentEventType, string> = {
  uploaded: 'Document ajouté',
  deleted: 'Document supprimé',
  downloaded: 'Téléchargement',
  link_copied: 'Lien copié',
  viewed: 'Consultation',
}

/** Mapping legacy media.clientDocuments */
export function legacyKindToDocumentType(kind: string): InterventionDocumentType {
  if (kind === 'qonto_quote') return 'quote'
  if (kind === 'qonto_invoice') return 'invoice'
  return 'attachment'
}
