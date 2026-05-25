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

/** Médias terrain SAV (photos, signatures, PDF) */
export type InterventionMedia = {
  photos?: InterventionPhoto[]
  clientSignature?: string
  technicianSignature?: string
  /** @deprecated Utiliser clientSignature */
  signatureUrl?: string
  pdfUrl?: string
  aiDiagnosticHint?: string
  /** Préparation devis / facture / IA */
  quoteDraft?: Record<string, unknown>
  invoiceDraft?: Record<string, unknown>
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
  media?: InterventionMedia
  /** Pièces utilisées sur l'intervention */
  partsLines?: CommercialLine[]
  createdAt: string
  updatedAt: string
  userId: string
}

export type InterventionInsert = Omit<Intervention, 'id' | 'createdAt' | 'updatedAt'>
export type InterventionUpdate = Partial<Omit<Intervention, 'id' | 'userId' | 'createdAt'>>
