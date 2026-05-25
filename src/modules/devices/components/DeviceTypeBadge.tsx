import { Badge } from '@/components/ui/Badge'
import { getDeviceTypeVariant } from '@/modules/devices/utils/device-labels'

type DeviceTypeBadgeProps = {
  deviceType: string
}

export function DeviceTypeBadge({ deviceType }: DeviceTypeBadgeProps) {
  return <Badge variant={getDeviceTypeVariant(deviceType)}>{deviceType}</Badge>
}
