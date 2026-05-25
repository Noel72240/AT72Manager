/** Types bibliothèque heuristique SAV — extensible pour RAG / modèles locaux */

export type HeuristicDeviceCategory =
  | 'pc'
  | 'laptop'
  | 'smartphone'
  | 'tablet'
  | 'console'
  | 'printer'
  | 'network'
  | 'unknown'

export type HeuristicConfidence = 'faible' | 'moyenne' | 'élevée' | 'critique'

export type HeuristicUrgency = 'basse' | 'moyenne' | 'haute' | 'critique'

export type HeuristicSeverity = 'low' | 'medium' | 'high' | 'critical'

export type HeuristicKeyword = {
  term: string
  weight: number
}

export type HeuristicSymptomRule = {
  id: string
  label: string
  keywords: HeuristicKeyword[]
  patterns?: RegExp[]
  /** Synonymes étendus (résolus via normalizer) */
  aliases?: string[]
  causes: string[]
  components: string[]
  tests: string[]
  recommendations: string[]
  solutions?: string[]
  severity: HeuristicSeverity
  urgency: HeuristicUrgency
  /** Multiplicateur si appareil correspond */
  deviceBoost?: Partial<Record<HeuristicDeviceCategory, number>>
  /** Remplace / enrichit par appareil */
  causesByDevice?: Partial<Record<HeuristicDeviceCategory, string[]>>
  componentsByDevice?: Partial<Record<HeuristicDeviceCategory, string[]>>
  testsByDevice?: Partial<Record<HeuristicDeviceCategory, string[]>>
  solutionsByDevice?: Partial<Record<HeuristicDeviceCategory, string[]>>
  /** Synergie : si autre symptôme présent, bonus score */
  synergies?: Array<{ symptomId: string; bonus: number }>
}

export type HeuristicDeviceProfile = {
  category: HeuristicDeviceCategory
  label: string
  keywords: HeuristicKeyword[]
  commonFailures: string[]
  baselineTests: string[]
  expertNote?: string
  /** Composants fréquents atelier pour ce parc */
  frequentComponents?: string[]
}

export type HeuristicDeviceBundle = {
  profile: HeuristicDeviceProfile
  /** Règles additionnelles propres à la catégorie */
  extraSymptoms?: HeuristicSymptomRule[]
  /** Bonus score global catégorie pour IDs symptômes */
  symptomBoosts?: Partial<Record<string, number>>
}

export type MatchedSymptom = {
  ruleId: string
  label: string
  score: number
  matchedTerms: string[]
  probability: number
}

export type DeviceDetectionResult = {
  category: HeuristicDeviceCategory
  label: string
  score: number
  confidence: HeuristicConfidence
  confidencePercent: number
  scores: Record<HeuristicDeviceCategory, number>
  matchedTerms: string[]
  source: 'text' | 'context' | 'mixed'
}

export type HeuristicAnalysisResult = {
  device: DeviceDetectionResult
  symptoms: MatchedSymptom[]
  probableCauses: string[]
  suspectComponents: string[]
  testProcedures: string[]
  recommendations: string[]
  solutions: string[]
  diagnosticText: string
  expertSummary: string
  urgency: HeuristicUrgency
  confidence: HeuristicConfidence
  confidencePercent: number
  confidenceNote: string
  debug?: HeuristicDebugTrace
}

export type HeuristicDebugTrace = {
  normalizedText: string
  expandedSynonyms: string[]
  deviceScores: Record<HeuristicDeviceCategory, number>
  symptomScores: Array<{ id: string; score: number; terms: string[] }>
  fusionNotes: string[]
  durationMs: number
}

export type HeuristicEngineInput = {
  text: string
  userMessage: string
  contextText?: string
  capability?: string
  historyLength?: number
  clientName?: string
  existingDiagnostic?: string
  historySummary?: string
  trendsSummary?: string
  forcedDeviceCategory?: HeuristicDeviceCategory
  ragSnippets?: Array<{
    text: string
    weight: number
    source?: string
    componentHints?: string[]
    testHints?: string[]
  }>
}

export const HEURISTIC_DEVICE_LABELS: Record<HeuristicDeviceCategory, string> = {
  pc: 'PC fixe / bureau',
  laptop: 'PC portable',
  smartphone: 'Smartphone',
  tablet: 'Tablette',
  console: 'Console de jeux',
  printer: 'Imprimante',
  network: 'Équipement réseau',
  unknown: 'Appareil à identifier',
}

export const ALL_HEURISTIC_CATEGORIES: HeuristicDeviceCategory[] = [
  'pc',
  'laptop',
  'smartphone',
  'tablet',
  'console',
  'printer',
  'network',
  'unknown',
]
