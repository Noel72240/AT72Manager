import type { Client, Device, Intervention, CommercialLine } from '@/types/entities'

export type PortalQuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected'

export type PortalQuote = {
  id: string
  number: string
  clientId: string
  interventionId?: string
  deviceId?: string
  status: PortalQuoteStatus
  title?: string
  notes?: string
  lines: CommercialLine[]
  subtotal: number
  vatTotal: number
  total: number
  validUntil?: string
  convertedInvoiceId?: string
  createdAt: string
  updatedAt: string
  userId: string
}

export type PortalInvoiceStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'paid'

export type PortalInvoice = {
  id: string
  number: string
  clientId: string
  interventionId?: string
  deviceId?: string
  quoteId?: string
  status: PortalInvoiceStatus
  title?: string
  notes?: string
  lines: CommercialLine[]
  subtotal: number
  vatTotal: number
  total: number
  dueDate?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
  userId: string
}

/** Étapes timeline portail SAV */
export type PortalRepairStage =
  | 'received'
  | 'diagnostic'
  | 'parts_ordered'
  | 'repair_in_progress'
  | 'completed'
  | 'ready_pickup'

export type PortalRepairTimelineStep = {
  id: string
  stage: PortalRepairStage
  label: string
  description?: string
  at?: string
  status: 'pending' | 'active' | 'done'
}

export type ClientAccount = {
  id: string
  authUserId: string
  clientId: string
  workshopId: string
  enabled: boolean
  invitedAt: string
  lastLoginAt?: string
}

export type PortalClientSession = {
  authUserId: string
  clientId: string
  workshopId: string
  email: string
  fullName: string
}

export type PortalAuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

export type PortalMessageSender = 'client' | 'workshop'

export type PortalMessage = {
  id: string
  workshopId: string
  clientId: string
  interventionId?: string
  senderType: PortalMessageSender
  senderName?: string
  body: string
  readAt?: string
  createdAt: string
}

export type PortalNotificationKind =
  | 'intervention_updated'
  | 'quote_ready'
  | 'device_ready'
  | 'invoice_ready'
  | 'message_received'
  | 'appointment_reminder'

export type PortalNotification = {
  id: string
  workshopId: string
  clientId: string
  kind: PortalNotificationKind
  title: string
  body: string
  readAt?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export type PortalQuoteValidationStatus = 'pending' | 'accepted' | 'rejected'

export type PortalQuoteValidation = {
  id: string
  quoteId: string
  clientId: string
  workshopId: string
  status: PortalQuoteValidationStatus
  signatureData?: string
  clientNote?: string
  validatedAt?: string
  createdAt: string
  updatedAt: string
}

export type PortalRepairEvent = {
  id: string
  interventionId: string
  workshopId: string
  clientId: string
  stage: PortalRepairStage
  label: string
  note?: string
  isPublic: boolean
  createdAt: string
}

export type PortalSignaturePurpose = 'quote_acceptance' | 'repair_pickup' | 'general'

export type PortalClientSignature = {
  id: string
  clientId: string
  workshopId: string
  interventionId?: string
  quoteId?: string
  purpose: PortalSignaturePurpose
  signatureData: string
  signedAt: string
}

/** Snapshot offline portail */
export type PortalDataSnapshot = {
  clientId: string
  cachedAt: string
  client: Client
  interventions: Intervention[]
  devices: Device[]
  quotes: PortalQuote[]
  invoices: PortalInvoice[]
  messages: PortalMessage[]
  notifications: PortalNotification[]
}

/** Fonctionnalités futures (feature flags) */
export type PortalFutureFeatures = {
  onlinePayment: boolean
  onlineBooking: boolean
  pushNotifications: boolean
  clientMobileApp: boolean
  aiClientSupport: boolean
}

export const PORTAL_FUTURE_FEATURES: PortalFutureFeatures = {
  onlinePayment: false,
  onlineBooking: false,
  pushNotifications: false,
  clientMobileApp: false,
  aiClientSupport: false,
}
