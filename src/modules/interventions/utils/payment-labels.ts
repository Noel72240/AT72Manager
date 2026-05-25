import type { InterventionPaymentStatus } from '@/types/entities/intervention.types'

export const PAYMENT_STATUS_LABELS: Record<InterventionPaymentStatus, string> = {
  none: 'Non réglé',
  deposit_paid: 'Acompte versé',
  paid: 'Payé',
  waived: 'Offert / garantie',
}

export const ALL_PAYMENT_STATUSES: InterventionPaymentStatus[] = [
  'none',
  'deposit_paid',
  'paid',
  'waived',
]

export function normalizePaymentStatus(value: unknown): InterventionPaymentStatus {
  const v = String(value ?? 'none')
  if (v === 'deposit_paid' || v === 'paid' || v === 'waived') return v
  return 'none'
}
