import { useCallback } from 'react'
import { auditService } from '@/services/audit/audit.service'
import { useAuthStore } from '@/store/auth.store'
import type { AuditAction, AuditResource } from '@/types/audit.types'

export function useAudit() {
  const user = useAuthStore((state) => state.user)

  const log = useCallback(
    async (params: {
      action: AuditAction
      resource: AuditResource
      resourceId?: string
      summary: string
      metadata?: Record<string, unknown>
    }) => {
      if (!user?.workshopId) return

      await auditService.log({
        workshopId: user.workshopId,
        actorId: user.id,
        actorName: user.fullName,
        ...params,
      })
    },
    [user],
  )

  return { log }
}
