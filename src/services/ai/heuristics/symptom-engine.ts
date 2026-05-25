import type { HeuristicSymptomRule } from '@/data/heuristics/types'
import { getRulesForDevice } from '@/data/heuristics/index'
import type {
  SavAnalysisInput,
  SavHeuristicAnalysis,
  SavSymptomRule,
  SymptomMatch,
} from '@/services/ai/heuristics/sav-types'
import { analyzeWithHeuristicEngine } from '@/services/ai/heuristics/heuristic-engine'

function toSavSymptomRule(rule: HeuristicSymptomRule): SavSymptomRule {
  return {
    id: rule.id,
    label: rule.label,
    keywords: rule.keywords,
    patterns: rule.patterns,
    causes: rule.causes,
    components: rule.components,
    tests: rule.tests,
    recommendations: rule.recommendations,
    solutions: rule.solutions,
    causesByDevice: rule.causesByDevice,
    componentsByDevice: rule.componentsByDevice,
    testsByDevice: rule.testsByDevice,
    severity: rule.severity,
    urgency: rule.urgency,
  }
}

function mapDetectionSource(source: 'text' | 'context' | 'mixed'): 'issue' | 'context' | 'mixed' {
  return source === 'text' ? 'issue' : source
}

function resolveSeverity(
  symptoms: SymptomMatch[],
): 'low' | 'medium' | 'high' | 'critical' {
  if (symptoms.some((m) => m.rule.severity === 'critical')) return 'critical'
  if (symptoms.some((m) => m.rule.severity === 'high')) return 'high'
  if (symptoms.some((m) => m.rule.severity === 'medium')) return 'medium'
  return 'low'
}

export function analyzeSavIssue(input: SavAnalysisInput): SavHeuristicAnalysis {
  const contextLabel = [
    input.brand,
    input.model,
    input.deviceType,
    input.deviceLabel !== input.detectedDeviceLabel ? input.deviceLabel : '',
  ]
    .filter(Boolean)
    .join(' ')

  const result = analyzeWithHeuristicEngine({
    text: input.issue,
    userMessage: input.userMessage,
    contextText: contextLabel,
    capability: 'chat',
    historyLength: input.historyLength,
    clientName: input.clientName,
    existingDiagnostic: input.existingDiagnostic,
    historySummary: input.historySummary,
    trendsSummary: input.trendsSummary,
    forcedDeviceCategory: input.deviceCategory,
  })

  const rules = getRulesForDevice(result.device.category)
  const ruleById = new Map(rules.map((r) => [r.id, r]))

  const matchedSymptoms: SymptomMatch[] = result.symptoms.map((s) => ({
    rule: toSavSymptomRule(ruleById.get(s.ruleId)!),
    score: s.score,
    matchedTerms: s.matchedTerms,
    probability: s.probability,
  }))

  return {
    deviceCategory: result.device.category,
    deviceLabel: input.deviceLabel,
    detectedDeviceLabel: input.detectedDeviceLabel,
    issue: input.issue,
    matchedSymptoms,
    probableCauses: result.probableCauses,
    suspectComponents: result.suspectComponents,
    testProcedures: result.testProcedures,
    recommendations: result.recommendations,
    solutions: result.solutions,
    diagnosticText: result.diagnosticText,
    severity: resolveSeverity(matchedSymptoms),
    urgency: result.urgency,
    confidence: result.confidence,
    confidencePercent: result.confidencePercent,
    confidenceNote: result.confidenceNote,
    detection: {
      ...result.device,
      source: mapDetectionSource(result.device.source),
    },
    expertSummary: result.expertSummary,
  }
}

export type { SavSymptomRule as SavSymptomRuleLegacy }
