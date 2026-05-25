import type { Client, Device, Intervention, SparePart } from '@/types/entities'
import type { SavAiContext } from '@/services/ai/types'
import { getClientFullName } from '@/modules/clients/utils/client-name'
import { buildSavTrendInsights, formatTrendsForPrompt } from '@/services/ai/analytics/sav-analytics'

export type BuildSavContextInput = {
  client?: Client | null
  device?: Device | null
  intervention?: Intervention | null
  parts?: SparePart[]
  interventions?: Intervention[]
  includeTrends?: boolean
}

export function buildSavAiContext(input: BuildSavContextInput): SavAiContext {
  const { client, device, intervention, parts = [], interventions = [] } = input

  const context: SavAiContext = {}

  if (client) {
    context.client = {
      id: client.id,
      name: getClientFullName(client),
      email: client.email,
      phone: client.phone,
      notes: client.notes,
    }
  }

  if (device) {
    context.device = {
      id: device.id,
      brand: device.brand,
      model: device.model,
      deviceType: device.deviceType,
      imei: device.imei,
      serialNumber: device.serialNumber,
    }
  }

  if (intervention) {
    context.intervention = {
      id: intervention.id,
      reportedIssue: intervention.reportedIssue,
      diagnostic: intervention.diagnostic,
      technicianNotes: intervention.technicianNotes,
      status: intervention.status,
      brand: intervention.brand,
      model: intervention.model,
      deviceLabel: intervention.deviceLabel,
      scheduledAt: intervention.scheduledAt,
      priority: intervention.priority,
    }
  }

  if (parts.length > 0) {
    context.partsCatalog = parts.slice(0, 30).map((p) => ({
      name: p.name,
      reference: p.reference,
      category: p.category,
    }))
  }

  const related = filterRelatedHistory(interventions, client?.id, device?.id, intervention?.id)
  if (related.length > 0) {
    context.historySummary = formatHistorySummary(related)
  }

  if (input.includeTrends && interventions.length > 0) {
    const trends = buildSavTrendInsights(interventions, parts)
    context.trendsSummary = formatTrendsForPrompt(trends)
  }

  return context
}

function filterRelatedHistory(
  all: Intervention[],
  clientId?: string,
  deviceId?: string,
  currentId?: string,
): Intervention[] {
  return all
    .filter((item) => item.id !== currentId)
    .filter((item) => {
      if (clientId && item.clientId === clientId) return true
      if (deviceId && item.deviceId === deviceId) return true
      return false
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)
}

function formatHistorySummary(items: Intervention[]): string {
  return items
    .map((item) => {
      const date = new Date(item.createdAt).toLocaleDateString('fr-FR')
      return `- ${date} · ${item.status} · ${item.reportedIssue.slice(0, 80)}`
    })
    .join('\n')
}
