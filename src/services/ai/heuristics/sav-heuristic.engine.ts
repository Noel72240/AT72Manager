import type { AiCapability, AiCompletionRequest, SavAiContext } from '@/services/ai/types'
import type { SavAnalysisInput } from '@/services/ai/heuristics/sav-types'
import { detectHeuristicDevice } from '@/services/ai/heuristics/heuristic-device-detector'
import { analyzeSavIssue } from '@/services/ai/heuristics/symptom-engine'
import { buildCapabilityResponse } from '@/services/ai/heuristics/response-builder'
import { SAV_DEVICE_LABELS } from '@/services/ai/heuristics/sav-types'

export type { SavAnalysisInput, SavHeuristicAnalysis } from '@/services/ai/heuristics/sav-types'
export { analyzeSavIssue } from '@/services/ai/heuristics/symptom-engine'
export { analyzeWithHeuristicEngine } from '@/services/ai/heuristics/heuristic-engine'
export { getLastHeuristicDebugTrace } from '@/services/ai/heuristics/heuristic-debug'
export { getHeuristicLibraryStats } from '@/data/heuristics/index'
export { registerHeuristicRagProvider } from '@/services/ai/heuristics/heuristic-rag'

function extractIssueFromPrompt(message: string): string | null {
  const trimmed = message.trim()
  if (trimmed.length < 8) return null
  if (/^▶\s/.test(trimmed)) return null
  const generic =
    /^(analyse|génère|genere|propose|crée|creer|rédige|redige|fais|donne|écris|ecris|lance)/i.test(trimmed) &&
    /(panne|diagnostic|notes|devis|rapport|tendance|intervention)/i.test(trimmed)
  if (generic) return null
  return trimmed
}

function resolvePrimaryText(
  capability: AiCapability,
  userMessage: string,
  interventionIssue?: string,
): string {
  const promptIssue = extractIssueFromPrompt(userMessage)
  if (capability === 'chat' && promptIssue) return promptIssue
  if (capability === 'chat' && userMessage.trim().length >= 10 && !/^▶/.test(userMessage)) {
    return userMessage.trim()
  }
  if (promptIssue) return promptIssue
  if (interventionIssue?.trim()) return interventionIssue.trim()
  if (userMessage.length > 15) return userMessage.trim()
  return ''
}

export function resolveSavAnalysisInput(request: AiCompletionRequest): SavAnalysisInput {
  const ctx = request.context
  const capability = request.capability
  const interventionIssue = ctx?.intervention?.reportedIssue?.trim()

  const primaryRaw = resolvePrimaryText(capability, request.userMessage, interventionIssue)
  const issue =
    primaryRaw ||
    'Symptôme non précisé — décrivez la panne (ex. « ordinateur gaming ne s\'allume plus »).'

  const contextLabel = [
    ctx?.device?.brand ?? ctx?.intervention?.brand,
    ctx?.device?.model ?? ctx?.intervention?.model,
    ctx?.device?.deviceType ?? ctx?.intervention?.deviceLabel,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()

  const historyText = request.history
    ?.filter((m) => m.role === 'user')
    .slice(-4)
    .map((m) => m.content)
    .join(' ')

  const detectionRaw = detectHeuristicDevice({
    primary: [issue, request.userMessage].filter(Boolean).join(' '),
    context: contextLabel,
    capability,
    historyText,
  })

  const detectedDeviceLabel =
    detectionRaw.label !== 'Appareil à identifier'
      ? detectionRaw.label
      : contextLabel || SAV_DEVICE_LABELS[detectionRaw.category]

  return {
    issue,
    userMessage: request.userMessage,
    deviceCategory: detectionRaw.category,
    deviceLabel: contextLabel || detectedDeviceLabel,
    detectedDeviceLabel,
    brand: ctx?.device?.brand ?? ctx?.intervention?.brand,
    model: ctx?.device?.model ?? ctx?.intervention?.model,
    deviceType: ctx?.device?.deviceType ?? ctx?.intervention?.deviceLabel,
    clientName: ctx?.client?.name,
    status: ctx?.intervention?.status,
    priority: ctx?.intervention?.priority,
    existingDiagnostic: ctx?.intervention?.diagnostic,
    existingNotes: ctx?.intervention?.technicianNotes,
    historySummary: ctx?.historySummary,
    trendsSummary: ctx?.trendsSummary,
    historyLength: request.history?.length,
    detection: {
      ...detectionRaw,
      source: detectionRaw.source === 'text' ? 'issue' : detectionRaw.source,
    },
  }
}

export function buildLocalSavResponse(request: AiCompletionRequest): string {
  const input = resolveSavAnalysisInput(request)
  const analysis = analyzeSavIssue(input)
  return buildCapabilityResponse(request.capability, input, analysis, request)
}

export function pickActiveInterventionFromList(
  interventions: Array<{
    id: string
    reportedIssue: string
    status: string
    brand?: string
    model?: string
    deviceLabel?: string
    diagnostic?: string
    technicianNotes?: string
    scheduledAt?: string
    priority?: string
    updatedAt: string
  }>,
) {
  const open = interventions.filter((i) => !['completed', 'returned'].includes(i.status))
  const sorted = [...open].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
  return sorted[0] ?? interventions[0] ?? null
}

export function enrichContextWithActiveIntervention(
  context: SavAiContext,
  interventions: Parameters<typeof pickActiveInterventionFromList>[0],
): SavAiContext {
  if (context.intervention?.reportedIssue?.trim()) return context
  const active = pickActiveInterventionFromList(interventions)
  if (!active) return context
  return {
    ...context,
    intervention: {
      id: active.id,
      reportedIssue: active.reportedIssue,
      diagnostic: active.diagnostic,
      technicianNotes: active.technicianNotes,
      status: active.status as NonNullable<SavAiContext['intervention']>['status'],
      brand: active.brand,
      model: active.model,
      deviceLabel: active.deviceLabel,
      scheduledAt: active.scheduledAt,
      priority: active.priority as NonNullable<SavAiContext['intervention']>['priority'],
    },
  }
}
