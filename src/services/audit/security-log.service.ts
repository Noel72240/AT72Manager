import { securityLogsRepository } from '@/services/database/repositories/security-logs.repository'
import type { SecurityEventType, SecurityLogInsert, SecuritySeverity } from '@/types/audit.types'

type LogSecurityParams = {
  eventType: SecurityEventType
  message: string
  severity?: SecuritySeverity
  userId?: string
  workshopId?: string
  metadata?: Record<string, unknown>
}

export const securityLogService = {
  async log(params: LogSecurityParams): Promise<void> {
    const entry: SecurityLogInsert = {
      eventType: params.eventType,
      message: params.message,
      severity: params.severity ?? 'info',
      userId: params.userId,
      workshopId: params.workshopId,
      metadata: params.metadata,
    }

    try {
      await securityLogsRepository.create(entry)
    } catch (error) {
      console.warn('[security] log échoué:', error)
    }
  },

  async list(workshopId: string, limit = 80) {
    return securityLogsRepository.list(workshopId, limit)
  },
}
