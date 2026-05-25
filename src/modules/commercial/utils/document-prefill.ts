import type { Device, Intervention } from '@/types/entities'
import type { DocumentPrefill } from '@/modules/commercial/types/commercial-module.types'
import { createEmptyLine } from '@/modules/commercial/utils/document-totals'

export function prefillFromIntervention(intervention: Intervention): DocumentPrefill {
  return {
    clientId: intervention.clientId,
    interventionId: intervention.id,
    deviceId: intervention.deviceId,
    title: intervention.reportedIssue?.slice(0, 80),
    lines: [
      {
        ...createEmptyLine('labor'),
        description: intervention.reportedIssue ?? 'Intervention SAV',
        unitPrice: intervention.estimatedPrice ?? intervention.finalPrice ?? 0,
      },
    ],
  }
}

export function prefillFromClient(clientId: string): DocumentPrefill {
  return { clientId, lines: [createEmptyLine('labor')] }
}

export function prefillFromDevice(device: Device): DocumentPrefill {
  const label = [device.brand, device.model].filter(Boolean).join(' ').trim()
  return {
    clientId: device.clientId,
    deviceId: device.id,
    title: label || device.deviceType || 'Appareil',
    lines: [createEmptyLine('part')],
  }
}
