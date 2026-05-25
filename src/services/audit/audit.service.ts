import { auditLogsRepository } from '@/services/database/repositories/audit-logs.repository'
import type { AuditAction, AuditLogInsert, AuditResource } from '@/types/audit.types'

type LogAuditParams = {
  workshopId: string
  actorId: string
  actorName: string
  action: AuditAction
  resource: AuditResource
  resourceId?: string
  summary: string
  metadata?: Record<string, unknown>
}

export const auditService = {
  async log(params: LogAuditParams): Promise<void> {
    const entry: AuditLogInsert = {
      workshopId: params.workshopId,
      actorId: params.actorId,
      actorName: params.actorName,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      summary: params.summary,
      metadata: params.metadata,
    }

    try {
      await auditLogsRepository.create(entry)
    } catch (error) {
      console.warn('[audit] enregistrement local échoué:', error)
    }
  },

  async list(workshopId: string, limit = 100) {
    return auditLogsRepository.list(workshopId, limit)
  },
}
