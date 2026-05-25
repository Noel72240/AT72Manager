export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'restore'
  | 'export'
  | 'import'
  | 'permission_denied'
  | 'view'

export type AuditResource =
  | 'client'
  | 'intervention'
  | 'device'
  | 'quote'
  | 'invoice'
  | 'spare_part'
  | 'stock'
  | 'backup'
  | 'user'
  | 'session'
  | 'settings'
  | 'ai'
  | 'document'

export type AuditLogEntry = {
  id: string
  workshopId: string
  actorId: string
  actorName: string
  action: AuditAction
  resource: AuditResource
  resourceId?: string
  summary: string
  metadata?: Record<string, unknown>
  deviceLabel?: string
  createdAt: string
  syncedAt?: string
}

export type AuditLogInsert = Omit<AuditLogEntry, 'id' | 'createdAt' | 'syncedAt'>

export type SecurityEventType =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'session_started'
  | 'session_ended'
  | 'permission_denied'
  | 'role_changed'
  | 'suspicious_activity'
  | 'document_download_denied'

export type SecuritySeverity = 'info' | 'warning' | 'critical'

export type SecurityLogEntry = {
  id: string
  workshopId?: string
  userId?: string
  eventType: SecurityEventType
  severity: SecuritySeverity
  message: string
  deviceLabel?: string
  metadata?: Record<string, unknown>
  createdAt: string
  syncedAt?: string
}

export type SecurityLogInsert = Omit<SecurityLogEntry, 'id' | 'createdAt' | 'syncedAt'>

export type UserSessionRecord = {
  id: string
  userId: string
  workshopId?: string
  deviceLabel: string
  deviceFingerprint: string
  startedAt: string
  lastActiveAt: string
  endedAt?: string
  isActive: boolean
}
