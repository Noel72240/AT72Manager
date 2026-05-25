import type { InvoiceStatus, QuoteStatus } from '@/types/entities'

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  rejected: 'Refusé',
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  accepted: 'Acceptée',
  rejected: 'Refusée',
  paid: 'Payée',
}

export const ALL_QUOTE_STATUSES: QuoteStatus[] = [
  'draft',
  'sent',
  'accepted',
  'rejected',
]

export const ALL_INVOICE_STATUSES: InvoiceStatus[] = [
  'draft',
  'sent',
  'accepted',
  'rejected',
  'paid',
]
