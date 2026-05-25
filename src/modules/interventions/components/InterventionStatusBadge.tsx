import type { InterventionStatus } from '@/types/entities/intervention.types'
import { Badge } from '@/components/ui/Badge'
import { STATUS_LABELS, STATUS_VARIANTS } from '@/modules/interventions/utils/intervention-labels'

export { STATUS_LABELS }

type InterventionStatusBadgeProps = {
  status: InterventionStatus
}

export function InterventionStatusBadge({ status }: InterventionStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
}
