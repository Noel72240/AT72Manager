export const DB_NAME = 'at72manager'
export const DB_VERSION = 16

export const STORES = {
  meta: 'meta',
  syncQueue: 'sync_queue',
  clients: 'clients',
  interventions: 'interventions',
  devices: 'devices',
  interventionPhotos: 'intervention_photos',
  interventionDocuments: 'intervention_documents',
  interventionDocumentEvents: 'intervention_document_events',
  interventionDocumentBlobs: 'intervention_document_blobs',
  quotes: 'quotes',
  invoices: 'invoices',
  spareParts: 'spare_parts',
  stockMovements: 'stock_movements',
  activityFeed: 'activity_feed',
  aiConversations: 'ai_conversations',
  backupSnapshots: 'backup_snapshots',
  profiles: 'profiles',
  auditLogs: 'audit_logs',
  securityLogs: 'security_logs',
  userSessions: 'user_sessions',
  calendarSyncLinks: 'calendar_sync_links',
  googleCalendarQueue: 'google_calendar_queue',
  portalCache: 'portal_cache',
} as const

export type StoreName = (typeof STORES)[keyof typeof STORES]
