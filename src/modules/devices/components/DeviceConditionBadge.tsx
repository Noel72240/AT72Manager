import type { DeviceCondition } from '@/types/entities/device.types'
import { Badge } from '@/components/ui/Badge'
import { CONDITION_LABELS, CONDITION_VARIANTS } from '@/modules/devices/utils/device-labels'

export { CONDITION_LABELS }

type DeviceConditionBadgeProps = {
  condition: DeviceCondition
}

export function DeviceConditionBadge({ condition }: DeviceConditionBadgeProps) {
  return <Badge variant={CONDITION_VARIANTS[condition]}>{CONDITION_LABELS[condition]}</Badge>
}
