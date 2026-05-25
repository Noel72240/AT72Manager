import type { CommercialLine } from './commercial.types'

/** Priorité planning SAV */
export type InterventionPriority = 'low' | 'medium' | 'high' | 'urgent'

/** Statuts métier SAV AT72Manager */
export type InterventionStatus =
  | 'diagnostic'
  | 'in_progress'
  | 'waiting_parts'
  | 'completed'
  | 'returned'

export type InterventionPhoto = {
  id: string
  name: string
  dataUrl: string
  createdAt: string
  /** Préparation sync cloud (stockage distant futur) */
  syncStatus?: 'local' | 'pending' | 'synced'
}

/** Document commercial Qonto partagé avec le client (devis / facture PDF) */
export type InterventionClientDocumentKind = 'qonto_quote' | 'qonto_invoice'

export type InterventionClientDocument = {
  id: string
  kind: InterventionClientDocumentKind
  fileName: string
  /** Chemin Supabase Storage (sans dataUrl en sync cloud) */
  storagePath?: string
  uploadedAt: string
  syncStatus?: 'local' | 'pending' | 'synced'
  /** Présent en local IndexedDB uniquement */
  dataUrl?: string
}

/** Statut paiement simplifié (facturation via Qonto) */
export type InterventionPaymentStatus = 'none' | 'deposit_paid' | 'paid' | 'waived'

export type InterventionMedia = {
  photos?: InterventionPhoto[]
  /** PDF devis/facture Qonto visibles sur le portail client */
  clientDocuments?: InterventionClientDocument[]
  clientSignature?: string
  technicianSignature?: string
  /** @deprecated Utiliser clientSignature */
  signatureUrl?: string
  pdfUrl?: string
  aiDiagnosticHint?: string
  aiReportDraft?: Record<string, unknown>
}

export type Intervention = {
  id: string
  clientId: string
  deviceId?: string
  deviceLabel?: string
  brand?: string
  model?: string
  imeiOrSerial?: string
  reportedIssue: string
  diagnostic?: string
  technicianNotes?: string
  status: InterventionStatus
  /** Planning — date/heure du rendez-vous */
  scheduledAt?: string
  completedAt?: string
  priority?: InterventionPriority
  /** Durée estimée en minutes */
  durationMinutes?: number
  /** Préparation assignation technicien (sync future) */
  assignedTechnicianId?: string
  estimatedPrice?: number
  finalPrice?: number
  /** Acompte client (€) */
  depositAmount?: number
  paymentStatus?: InterventionPaymentStatus
  /** Facturé dans Qonto (ou autre outil externe) */
  billedViaQonto?: boolean
  /** Référence facture externe (ex. numéro Qonto) */
  externalInvoiceRef?: string
  /** Lien direct vers le document Qonto */
  qontoDocumentUrl?: string
  media?: InterventionMedia
  /** Pièces utilisées sur l'intervention */
  partsLines?: CommercialLine[]
  createdAt: string
  updatedAt: string
  userId: string
}

export type InterventionInsert = Omit<Intervention, 'id' | 'createdAt' | 'updatedAt'>
export type InterventionUpdate = Partial<Omit<Intervention, 'id' | 'userId' | 'createdAt'>>
