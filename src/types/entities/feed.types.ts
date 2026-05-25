/** Types d'événements métier (notifications + activité) */
export type FeedItemKind =
  | 'stock_low'
  | 'stock_out'
  | 'intervention_urgent'
  | 'intervention_scheduled'
  | 'intervention_due_soon'
  | 'intervention_completed'
  | 'quote_accepted'
  | 'invoice_unpaid'
  | 'sync_error'
  | 'sync_success'
  | 'client_created'
  | 'intervention_created'
  | 'intervention_updated'
  | 'part_added'
  | 'pdf_generated'
  | 'device_created'
  | 'backup_success'
  | 'backup_failed'
  | 'backup_restored'

export type FeedSeverity = 'info' | 'success' | 'warning' | 'danger'

export type ActivityFeedItem = {
  id: string
  kind: FeedItemKind
  title: string
  message?: string
  severity: FeedSeverity
  href?: string
  entityType?: string
  entityId?: string
  dedupeKey?: string
  createdAt: string
  read: boolean
  archived: boolean
  userId: string
}

export type ActivityFeedItemInsert = Omit<
  ActivityFeedItem,
  'id' | 'createdAt' | 'read' | 'archived'
>
