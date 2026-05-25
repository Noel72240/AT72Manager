import type { CommercialLine, Quote, QuoteStatus } from '@/types/entities'
import type { SortDirection } from '@/modules/commercial/types/commercial-module.types'

export type QuoteSortField = 'createdAt' | 'number' | 'total' | 'status' | 'client'

export type QuoteStatusFilter = QuoteStatus | 'all'

export type QuoteFilters = {
  search: string
  status: QuoteStatusFilter
  sort: { field: QuoteSortField; direction: SortDirection }
  page: number
  pageSize: number
}

export const DEFAULT_QUOTE_FILTERS: QuoteFilters = {
  search: '',
  status: 'all',
  sort: { field: 'createdAt', direction: 'desc' },
  page: 1,
  pageSize: 10,
}

export type QuoteFormValues = {
  clientId: string
  interventionId: string
  deviceId: string
  status: QuoteStatus
  title: string
  notes: string
  validUntil: string
  lines: CommercialLine[]
}

export const EMPTY_QUOTE_FORM: QuoteFormValues = {
  clientId: '',
  interventionId: '',
  deviceId: '',
  status: 'draft',
  title: '',
  notes: '',
  validUntil: '',
  lines: [],
}

export type QuoteTableRow = Quote & {
  clientName: string
}
