import type { CommercialLine } from './commercial.types'

export type InvoiceStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'paid'

export type Invoice = {
  id: string
  number: string
  clientId: string
  interventionId?: string
  deviceId?: string
  quoteId?: string
  status: InvoiceStatus
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

export type InvoiceInsert = Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>
export type InvoiceUpdate = Partial<
  Omit<Invoice, 'id' | 'userId' | 'createdAt' | 'number'>
>
