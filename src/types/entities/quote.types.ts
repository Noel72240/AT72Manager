import type { CommercialLine } from './commercial.types'

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected'

export type Quote = {
  id: string
  number: string
  clientId: string
  interventionId?: string
  deviceId?: string
  status: QuoteStatus
  title?: string
  notes?: string
  lines: CommercialLine[]
  subtotal: number
  vatTotal: number
  total: number
  validUntil?: string
  /** Facture générée depuis ce devis */
  convertedInvoiceId?: string
  createdAt: string
  updatedAt: string
  userId: string
}

export type QuoteInsert = Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>
export type QuoteUpdate = Partial<
  Omit<Quote, 'id' | 'userId' | 'createdAt' | 'number'>
>
