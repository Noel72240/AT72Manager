import type { ClientStatus } from '@/types/entities/client.types'
import { Badge } from '@/components/ui/Badge'
import type { BadgeVariant } from '@/theme/variants'

const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  prospect: 'Prospect',
}

const STATUS_VARIANTS: Record<ClientStatus, BadgeVariant> = {
  active: 'success',
  inactive: 'default',
  prospect: 'primary',
}

type ClientStatusBadgeProps = {
  status: ClientStatus
}

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
}

export { STATUS_LABELS }
