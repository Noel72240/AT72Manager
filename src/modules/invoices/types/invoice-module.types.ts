import type { CommercialLine, Invoice, InvoiceStatus } from '@/types/entities'
import type { SortDirection } from '@/modules/commercial/types/commercial-module.types'

export type InvoiceSortField = 'createdAt' | 'number' | 'total' | 'status' | 'client'

export type InvoiceStatusFilter = InvoiceStatus | 'all'

export type InvoiceFilters = {
  search: string
  status: InvoiceStatusFilter
  sort: { field: InvoiceSortField; direction: SortDirection }
  page: number
  pageSize: number
}

export const DEFAULT_INVOICE_FILTERS: InvoiceFilters = {
  search: '',
  status: 'all',
  sort: { field: 'createdAt', direction: 'desc' },
  page: 1,
  pageSize: 10,
}

export type InvoiceFormValues = {
  clientId: string
  interventionId: string
  deviceId: string
  quoteId: string
  status: InvoiceStatus
  title: string
  notes: string
  dueDate: string
  lines: CommercialLine[]
}

export const EMPTY_INVOICE_FORM: InvoiceFormValues = {
  clientId: '',
  interventionId: '',
  deviceId: '',
  quoteId: '',
  status: 'draft',
  title: '',
  notes: '',
  dueDate: '',
  lines: [],
}

export type InvoiceTableRow = Invoice & {
  clientName: string
}
