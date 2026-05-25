import type { HeuristicSymptomRule } from '@/data/heuristics/types'
import { normalizeHeuristicText } from '@/services/ai/heuristics/text-normalizer'

type IndexedHit = { ruleId: string; weight: number; term: string }

let _keywordIndex: Map<string, IndexedHit[]> | null = null
let _rulesById: Map<string, HeuristicSymptomRule> | null = null
let _indexedRuleCount = 0

function tokenizeForIndex(text: string): string[] {
  return normalizeHeuristicText(text).split(' ').filter((t) => t.length >= 3)
}

export function buildSymptomIndex(rules: HeuristicSymptomRule[]): void {
  const index = new Map<string, IndexedHit[]>()
  const byId = new Map<string, HeuristicSymptomRule>()

  for (const rule of rules) {
    byId.set(rule.id, rule)
    const terms = [
      ...rule.keywords.map((k) => ({ term: k.term, weight: k.weight })),
      ...(rule.aliases?.map((a) => ({ term: a, weight: 1.5 })) ?? []),
    ]
    for (const { term, weight } of terms) {
      const norm = normalizeHeuristicText(term)
      if (norm.length < 2) continue
      const tokens = norm.includes(' ') ? [norm, ...tokenizeForIndex(norm)] : [norm, ...tokenizeForIndex(norm)]
      for (const token of new Set(tokens)) {
        const bucket = index.get(token) ?? []
        bucket.push({ ruleId: rule.id, weight, term })
        index.set(token, bucket)
      }
    }
  }

  _keywordIndex = index
  _rulesById = byId
  _indexedRuleCount = rules.length
}

export function getIndexedRuleCount(): number {
  return _indexedRuleCount
}

/** Pré-filtre les règles candidates via index inversé (perf) */
export function getCandidateRules(allRules: HeuristicSymptomRule[], haystack: string): HeuristicSymptomRule[] {
  if (!_keywordIndex || !_rulesById || _indexedRuleCount !== allRules.length) {
    buildSymptomIndex(allRules)
  }

  const index = _keywordIndex!
  const normalized = normalizeHeuristicText(haystack)
  const candidateIds = new Set<string>()

  for (const token of normalized.split(' ')) {
    const hits = index.get(token)
    if (hits) hits.forEach((h) => candidateIds.add(h.ruleId))
  }

  for (const [token, hits] of index) {
    if (token.includes(' ') && normalized.includes(token)) {
      hits.forEach((h) => candidateIds.add(h.ruleId))
    }
  }

  if (candidateIds.size === 0) return allRules
  return allRules.filter((r) => candidateIds.has(r.id))
}

export function getRuleById(id: string): HeuristicSymptomRule | undefined {
  return _rulesById?.get(id)
}
