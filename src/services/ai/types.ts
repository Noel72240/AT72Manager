import type { Device, Intervention, SparePart } from '@/types/entities'

export type AiCapability =
  | 'chat'
  | 'diagnose'
  | 'generate_diagnostic'
  | 'generate_technician_notes'
  | 'generate_intervention_summary'
  | 'generate_quote_text'
  | 'generate_sav_report'
  | 'analyze_trends'

export type AiMessageRole = 'system' | 'user' | 'assistant'

export type AiChatMessage = {
  id: string
  role: AiMessageRole
  content: string
  capability?: AiCapability
  createdAt: string
}

export type AiConversation = {
  id: string
  title: string
  messages: AiChatMessage[]
  contextSnapshot?: SavAiContext
  createdAt: string
  updatedAt: string
  userId: string
}

export type SavAiContext = {
  client?: {
    id: string
    name: string
    email?: string
    phone?: string
    notes?: string
  }
  device?: Pick<Device, 'id' | 'brand' | 'model' | 'deviceType' | 'imei' | 'serialNumber'>
  intervention?: Pick<
    Intervention,
    | 'id'
    | 'reportedIssue'
    | 'diagnostic'
    | 'technicianNotes'
    | 'status'
    | 'brand'
    | 'model'
    | 'deviceLabel'
    | 'scheduledAt'
    | 'priority'
  >
  partsCatalog?: Array<Pick<SparePart, 'name' | 'reference' | 'category'>>
  historySummary?: string
  trendsSummary?: string
}

export type AiCompletionRequest = {
  capability: AiCapability
  userMessage: string
  context?: SavAiContext
  history?: AiChatMessage[]
}

export type AiCompletionResponse = {
  content: string
  provider: 'openai' | 'mock' | 'local'
  model?: string
}

export type AiDiagnosticStructured = {
  probableCauses: string[]
  suspectComponents: string[]
  recommendations: string[]
  diagnosticText: string
  confidenceNote?: string
}

export type SavTrendInsight = {
  frequentIssues: Array<{ label: string; count: number }>
  recurringParts: Array<{ name: string; count: number }>
  statusBreakdown: Array<{ status: string; count: number }>
  summary: string
}
