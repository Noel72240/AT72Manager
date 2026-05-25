import type { PortalInvoiceStatus, PortalQuoteStatus } from '@/types/portal.types'

export const QUOTE_STATUS_LABELS: Record<PortalQuoteStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  rejected: 'Refusé',
}

export const INVOICE_STATUS_LABELS: Record<PortalInvoiceStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  accepted: 'Acceptée',
  rejected: 'Refusée',
  paid: 'Payée',
}

export const ALL_QUOTE_STATUSES: PortalQuoteStatus[] = [
  'draft',
  'sent',
  'accepted',
  'rejected',
]

export const ALL_INVOICE_STATUSES: PortalInvoiceStatus[] = [
  'draft',
  'sent',
  'accepted',
  'rejected',
  'paid',
]
