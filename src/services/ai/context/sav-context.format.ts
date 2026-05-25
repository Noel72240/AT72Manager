import type { SavAiContext } from '@/services/ai/types'

export function formatSavContextBlock(context?: SavAiContext): string {
  if (!context) return ''

  const lines: string[] = []

  if (context.client) {
    lines.push(
      `Client: ${context.client.name}`,
      context.client.phone ? `Tél: ${context.client.phone}` : '',
      context.client.email ? `Email: ${context.client.email}` : '',
      context.client.notes ? `Notes client: ${context.client.notes}` : '',
    )
  }

  if (context.device) {
    lines.push(
      `Appareil: ${[context.device.brand, context.device.model, context.device.deviceType].filter(Boolean).join(' ')}`,
      context.device.imei ? `IMEI: ${context.device.imei}` : '',
      context.device.serialNumber ? `S/N: ${context.device.serialNumber}` : '',
    )
  }

  if (context.intervention) {
    lines.push(
      `Intervention: ${context.intervention.reportedIssue}`,
      context.intervention.diagnostic ? `Diagnostic actuel: ${context.intervention.diagnostic}` : '',
      context.intervention.technicianNotes
        ? `Notes technicien: ${context.intervention.technicianNotes}`
        : '',
      `Statut: ${context.intervention.status}`,
      context.intervention.priority ? `Priorité: ${context.intervention.priority}` : '',
      context.intervention.scheduledAt
        ? `Planifié: ${new Date(context.intervention.scheduledAt).toLocaleString('fr-FR')}`
        : '',
    )
  }

  if (context.partsCatalog?.length) {
    lines.push(
      'Catalogue pièces (extrait):',
      ...context.partsCatalog.slice(0, 15).map((p) => `- ${p.name} (${p.reference}) [${p.category}]`),
    )
  }

  if (context.historySummary) {
    lines.push(`Historique client/appareil:\n${context.historySummary}`)
  }

  if (context.trendsSummary) {
    lines.push(`Tendances atelier:\n${context.trendsSummary}`)
  }

  return lines.filter(Boolean).join('\n')
}
