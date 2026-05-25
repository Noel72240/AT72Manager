import type {
  HeuristicDeviceCategory,
  HeuristicSeverity,
  HeuristicSymptomRule,
  HeuristicUrgency,
} from '@/data/heuristics/types'

type RuleDraft = {
  id: string
  label: string
  keywords: Array<{ term: string; weight: number }>
  causes: string[]
  components: string[]
  tests: string[]
  recommendations?: string[]
  solutions?: string[]
  severity?: HeuristicSeverity
  urgency?: HeuristicUrgency
  aliases?: string[]
  patterns?: RegExp[]
  deviceBoost?: Partial<Record<HeuristicDeviceCategory, number>>
  causesByDevice?: HeuristicSymptomRule['causesByDevice']
  componentsByDevice?: HeuristicSymptomRule['componentsByDevice']
  testsByDevice?: HeuristicSymptomRule['testsByDevice']
  solutionsByDevice?: HeuristicSymptomRule['solutionsByDevice']
  synergies?: HeuristicSymptomRule['synergies']
}

/** Fabrique une règle SAV complète avec valeurs par défaut atelier */
export function savRule(draft: RuleDraft): HeuristicSymptomRule {
  return {
    recommendations: draft.recommendations ?? ['Documenter symptômes avant démontage'],
    severity: draft.severity ?? 'medium',
    urgency: draft.urgency ?? 'moyenne',
    ...draft,
  }
}

export function savRules(...drafts: RuleDraft[]): HeuristicSymptomRule[] {
  return drafts.map(savRule)
}
