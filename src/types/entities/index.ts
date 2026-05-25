export type { Client, ClientInsert, ClientStatus, ClientUpdate } from './client.types'
export type {
  Device,
  DeviceCondition,
  DeviceInsert,
  DeviceMedia,
  DeviceUpdate,
} from './device.types'
export type {
  Intervention,
  InterventionInsert,
  InterventionMedia,
  InterventionPhoto,
  InterventionPriority,
  InterventionStatus,
  InterventionUpdate,
} from './intervention.types'
export type {
  CommercialLine,
  CommercialLineKind,
  DocumentTotals,
} from './commercial.types'
export { DEFAULT_VAT_RATE, LINE_KIND_LABELS } from './commercial.types'
export type { Quote, QuoteInsert, QuoteStatus, QuoteUpdate } from './quote.types'
export type {
  Invoice,
  InvoiceInsert,
  InvoiceStatus,
  InvoiceUpdate,
} from './invoice.types'
export type {
  SparePart,
  SparePartInsert,
  SparePartUpdate,
  StockLevel,
} from './spare-part.types'
export type {
  StockMovement,
  StockMovementInsert,
  StockMovementType,
  StockReferenceType,
} from './stock-movement.types'
export type {
  ActivityFeedItem,
  ActivityFeedItemInsert,
  FeedItemKind,
  FeedSeverity,
} from './feed.types'

export type EntityName =
  | 'clients'
  | 'interventions'
  | 'devices'
  | 'quotes'
  | 'invoices'
  | 'spare_parts'
  | 'stock_movements'
  | 'activity_feed'
  | 'ai_conversations'

export type SyncAction = 'create' | 'update' | 'delete'

export type SyncQueueItem = {
  id: string
  entity: EntityName
  action: SyncAction
  entityId: string
  payload: unknown
  createdAt: string
  status: 'pending' | 'processing' | 'failed' | 'dead_letter'
  retryCount: number
  lastError?: string
  nextRetryAt?: string
  localUpdatedAt?: string
}
