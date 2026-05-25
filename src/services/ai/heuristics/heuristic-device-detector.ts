import type { AiCapability } from '@/services/ai/types'
import type { DeviceDetectionResult, HeuristicDeviceCategory } from '@/data/heuristics/types'
import { HEURISTIC_DEVICE_BUNDLES, HEURISTIC_DEVICE_BY_CATEGORY } from '@/data/heuristics/index'
import { ALL_HEURISTIC_CATEGORIES, HEURISTIC_DEVICE_LABELS } from '@/data/heuristics/types'
import { containsTerm, expandSynonyms, normalizeHeuristicText } from '@/services/ai/heuristics/text-normalizer'

export type DetectionSources = {
  primary: string
  context: string
  capability: AiCapability
  historyText?: string
}

function scoreTextAgainstBundles(
  text: string,
  weightMultiplier: number,
): { scores: Record<HeuristicDeviceCategory, number>; matched: string[] } {
  const { expanded } = expandSynonyms(text)
  const haystack = expanded
  const scores = Object.fromEntries(ALL_HEURISTIC_CATEGORIES.map((c) => [c, 0])) as Record<
    HeuristicDeviceCategory,
    number
  >
  const matched: string[] = []

  if (!haystack) return { scores, matched }

  for (const bundle of HEURISTIC_DEVICE_BUNDLES) {
    for (const { term, weight } of bundle.profile.keywords) {
      if (containsTerm(haystack, term)) {
        scores[bundle.profile.category] += weight * weightMultiplier
        matched.push(`${bundle.profile.category}:${term}`)
      }
    }
  }

  applyHeuristicBoosts(haystack, scores)
  return { scores, matched }
}

function applyHeuristicBoosts(haystack: string, scores: Record<HeuristicDeviceCategory, number>): void {
  const hasGaming = containsTerm(haystack, 'gaming') || containsTerm(haystack, 'gamer')
  const hasPortable =
    containsTerm(haystack, 'portable') ||
    containsTerm(haystack, 'laptop') ||
    containsTerm(haystack, 'macbook') ||
    containsTerm(haystack, 'notebook')

  if (hasGaming && !hasPortable) {
    scores.pc += 10
    scores.console += 4
  }

  if (containsTerm(haystack, 'ordinateur') && !hasPortable) {
    scores.pc += 8
    scores.laptop -= 2
  }

  if (containsTerm(haystack, 'pc') && !hasPortable) {
    scores.pc += 5
  }

  /** Éviter faux positif smartphone sur « portable » seul */
  if (containsTerm(haystack, 'portable') && !containsTerm(haystack, 'telephone')) {
    scores.laptop += 6
    scores.smartphone -= 3
  }

  if (containsTerm(haystack, 'iphone') || containsTerm(haystack, 'smartphone')) {
    scores.smartphone += 8
    scores.laptop -= 2
  }
}

function mergeScores(
  target: Record<HeuristicDeviceCategory, number>,
  source: Record<HeuristicDeviceCategory, number>,
): void {
  for (const cat of ALL_HEURISTIC_CATEGORIES) {
    target[cat] += source[cat] ?? 0
  }
}

function toConfidenceLevel(percent: number): DeviceDetectionResult['confidence'] {
  if (percent >= 80) return 'critique'
  if (percent >= 65) return 'élevée'
  if (percent >= 40) return 'moyenne'
  return 'faible'
}

export function detectHeuristicDevice(sources: DetectionSources): DeviceDetectionResult {
  const primaryWeight = sources.capability === 'chat' ? 3.2 : 2.8
  const contextWeight = sources.capability === 'chat' ? 0.45 : 0.85
  const historyWeight = 0.25

  const primaryResult = scoreTextAgainstBundles(sources.primary, primaryWeight)
  const contextResult = scoreTextAgainstBundles(sources.context, contextWeight)
  const historyResult = sources.historyText
    ? scoreTextAgainstBundles(sources.historyText, historyWeight)
    : { scores: Object.fromEntries(ALL_HEURISTIC_CATEGORIES.map((c) => [c, 0])) as Record<HeuristicDeviceCategory, number>, matched: [] as string[] }

  const scores = Object.fromEntries(ALL_HEURISTIC_CATEGORIES.map((c) => [c, 0])) as Record<
    HeuristicDeviceCategory,
    number
  >
  mergeScores(scores, primaryResult.scores)
  mergeScores(scores, contextResult.scores)
  mergeScores(scores, historyResult.scores)

  let best: HeuristicDeviceCategory = 'unknown'
  let bestScore = 0
  for (const cat of ALL_HEURISTIC_CATEGORIES) {
    if (cat === 'unknown') continue
    if (scores[cat] > bestScore) {
      bestScore = scores[cat]
      best = cat
    }
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1
  const confidencePercent = Math.min(98, Math.round((bestScore / total) * 100) || (bestScore > 0 ? 55 : 20))

  if (bestScore < 3) best = 'unknown'

  const bundle = HEURISTIC_DEVICE_BY_CATEGORY.get(best)
  const label = bundle?.profile.label ?? HEURISTIC_DEVICE_LABELS[best]

  const hasPrimary = primaryResult.matched.length > 0
  const hasContext = contextResult.matched.length > 0
  const source: DeviceDetectionResult['source'] =
    hasPrimary && hasContext ? 'mixed' : hasContext ? 'context' : 'text'

  return {
    category: best,
    label,
    score: bestScore,
    confidence: toConfidenceLevel(confidencePercent),
    confidencePercent,
    scores,
    matchedTerms: [...primaryResult.matched, ...contextResult.matched],
    source,
  }
}

export { normalizeHeuristicText, expandSynonyms, containsTerm }
