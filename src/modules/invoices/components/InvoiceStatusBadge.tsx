import type { InvoiceStatus } from '@/types/entities'
import { Badge } from '@/components/ui/Badge'
import { INVOICE_STATUS_LABELS } from '@/modules/commercial/utils/commercial-labels'
import { cn } from '@/utils/cn'

const STATUS_VARIANT: Record<
  InvoiceStatus,
  'default' | 'success' | 'warning' | 'danger' | 'primary'
> = {
  draft: 'default',
  sent: 'primary',
  accepted: 'success',
  rejected: 'danger',
  paid: 'success',
}

type InvoiceStatusBadgeProps = {
  status: InvoiceStatus
  className?: string
}

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn('shrink-0', className)}>
      {INVOICE_STATUS_LABELS[status]}
    </Badge>
  )
}
