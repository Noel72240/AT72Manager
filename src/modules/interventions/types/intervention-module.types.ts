import type { CommercialLine } from '@/types/entities'
import type {
  Intervention,
  InterventionPaymentStatus,
  InterventionStatus,
  InterventionMedia,
} from '@/types/entities/intervention.types'
import type { PendingDocumentUpload } from '@/services/interventions/intervention-documents.service'

export type InterventionFormValues = {
  clientId: string
  deviceLabel: string
  brand: string
  model: string
  customModel: string
  imeiOrSerial: string
  reportedIssue: string
  diagnostic: string
  technicianNotes: string
  status: InterventionStatus
  estimatedPrice: string
  finalPrice: string
  depositAmount: string
  paymentStatus: InterventionPaymentStatus
  billedViaQonto: boolean
  externalInvoiceRef: string
  qontoDocumentUrl: string
  media: InterventionMedia
  partsLines: CommercialLine[]
  pendingDocumentUploads: PendingDocumentUpload[]
  notifyClientOnDocuments: boolean
}

export type InterventionSortField = 'createdAt' | 'status' | 'client' | 'estimatedPrice'
export type SortDirection = 'asc' | 'desc'

export type InterventionSort = {
  field: InterventionSortField
  direction: SortDirection
}

export type InterventionStatusFilter = InterventionStatus | 'all'

export type InterventionFilters = {
  search: string
  status: InterventionStatusFilter
  sort: InterventionSort
  page: number
  pageSize: number
}

export type InterventionTableRow = Intervention & {
  clientName: string
  deviceSummary: string
}

export const DEFAULT_INTERVENTION_FILTERS: InterventionFilters = {
  search: '',
  status: 'all',
  sort: { field: 'createdAt', direction: 'desc' },
  page: 1,
  pageSize: 10,
}

export const EMPTY_INTERVENTION_FORM: InterventionFormValues = {
  clientId: '',
  deviceLabel: '',
  brand: '',
  model: '',
  customModel: '',
  imeiOrSerial: '',
  reportedIssue: '',
  diagnostic: '',
  technicianNotes: '',
  status: 'diagnostic',
  estimatedPrice: '',
  finalPrice: '',
  depositAmount: '',
  paymentStatus: 'none',
  billedViaQonto: false,
  externalInvoiceRef: '',
  qontoDocumentUrl: '',
  media: { photos: [] },
  partsLines: [],
  pendingDocumentUploads: [],
  notifyClientOnDocuments: true,
}

export const FUTURE_INTERVENTION_FEATURES = {
  cloudSync: 'Sync photos cloud (à venir)',
} as const
