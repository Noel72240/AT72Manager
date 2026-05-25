/** Types partagés du moteur expert SAV local */
export type SavDeviceCategory =
  | 'smartphone'
  | 'tablet'
  | 'laptop'
  | 'pc'
  | 'console'
  | 'printer'
  | 'network'
  | 'unknown'

export type SavConfidenceLevel = 'faible' | 'moyenne' | 'élevée' | 'critique'

export type SavUrgencyLevel = 'basse' | 'moyenne' | 'haute' | 'critique'

export type SavSymptomRule = {
  id: string
  label: string
  keywords: Array<{ term: string; weight: number }>
  patterns?: RegExp[]
  causes: string[]
  components: string[]
  tests: string[]
  recommendations: string[]
  solutions?: string[]
  componentsByDevice?: Partial<Record<SavDeviceCategory, string[]>>
  causesByDevice?: Partial<Record<SavDeviceCategory, string[]>>
  testsByDevice?: Partial<Record<SavDeviceCategory, string[]>>
  severity?: 'low' | 'medium' | 'high' | 'critical'
  urgency?: SavUrgencyLevel
}

export type SavDeviceProfile = {
  category: SavDeviceCategory
  label: string
  keywords: Array<{ term: string; weight: number }>
  commonFailures: string[]
  baselineTests: string[]
  expertNote?: string
  frequentComponents?: string[]
}

export type DeviceDetectionResult = {
  category: SavDeviceCategory
  label: string
  score: number
  confidence: SavConfidenceLevel
  confidencePercent: number
  scores: Record<SavDeviceCategory, number>
  matchedTerms: string[]
  source: 'issue' | 'context' | 'mixed'
}

export type SymptomMatch = {
  rule: SavSymptomRule
  score: number
  matchedTerms: string[]
  probability?: number
}

export type SavAnalysisInput = {
  issue: string
  userMessage: string
  deviceCategory: SavDeviceCategory
  deviceLabel: string
  detectedDeviceLabel: string
  brand?: string
  model?: string
  deviceType?: string
  clientName?: string
  status?: string
  priority?: string
  existingDiagnostic?: string
  existingNotes?: string
  historySummary?: string
  trendsSummary?: string
  detection: DeviceDetectionResult
  historyLength?: number
}

export type SavHeuristicAnalysis = {
  deviceCategory: SavDeviceCategory
  deviceLabel: string
  detectedDeviceLabel: string
  issue: string
  matchedSymptoms: SymptomMatch[]
  probableCauses: string[]
  suspectComponents: string[]
  testProcedures: string[]
  recommendations: string[]
  solutions: string[]
  diagnosticText: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  urgency: SavUrgencyLevel
  confidence: SavConfidenceLevel
  confidencePercent: number
  confidenceNote: string
  detection: DeviceDetectionResult
  expertSummary: string
}

export const SAV_DEVICE_LABELS: Record<SavDeviceCategory, string> = {
  smartphone: 'Smartphone',
  tablet: 'Tablette',
  laptop: 'PC portable',
  pc: 'PC fixe / bureau',
  console: 'Console de jeux',
  printer: 'Imprimante',
  network: 'Équipement réseau',
  unknown: 'Appareil à identifier',
}
