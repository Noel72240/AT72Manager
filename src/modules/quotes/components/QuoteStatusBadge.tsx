import type { QuoteStatus } from '@/types/entities'
import { Badge } from '@/components/ui/Badge'
import { QUOTE_STATUS_LABELS } from '@/modules/commercial/utils/commercial-labels'
import { cn } from '@/utils/cn'

const STATUS_VARIANT: Record<
  QuoteStatus,
  'default' | 'success' | 'warning' | 'danger' | 'primary'
> = {
  draft: 'default',
  sent: 'primary',
  accepted: 'success',
  rejected: 'danger',
}

type QuoteStatusBadgeProps = {
  status: QuoteStatus
  className?: string
}

export function QuoteStatusBadge({ status, className }: QuoteStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn('shrink-0', className)}>
      {QUOTE_STATUS_LABELS[status]}
    </Badge>
  )
}
