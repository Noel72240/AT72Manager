import type {
  HeuristicAnalysisResult,
  HeuristicConfidence,
  HeuristicDeviceCategory,
  HeuristicEngineInput,
  HeuristicSymptomRule,
  HeuristicUrgency,
  MatchedSymptom,
} from '@/data/heuristics/types'
import { getRulesForDevice } from '@/data/heuristics/index'
import { HEURISTIC_DEVICE_BY_CATEGORY } from '@/data/heuristics/index'
import { getCandidateRules } from '@/data/heuristics/symptom-index'
import { detectHeuristicDevice, expandSynonyms } from '@/services/ai/heuristics/heuristic-device-detector'
import { containsTerm, normalizeHeuristicText } from '@/services/ai/heuristics/text-normalizer'
import { logHeuristicDebug } from '@/services/ai/heuristics/heuristic-debug'
import { mergeRagIntoAnalysis } from '@/services/ai/heuristics/heuristic-rag'

const URGENCY_RANK: Record<HeuristicUrgency, number> = {
  basse: 1,
  moyenne: 2,
  haute: 3,
  critique: 4,
}

function matchSymptoms(
  haystack: string,
  rules: HeuristicSymptomRule[],
  device: HeuristicDeviceCategory,
): MatchedSymptom[] {
  const matches: MatchedSymptom[] = []

  for (const rule of rules) {
    let score = 0
    const matchedTerms: string[] = []

    for (const { term, weight } of rule.keywords) {
      if (containsTerm(haystack, term)) {
        score += weight
        matchedTerms.push(term)
      }
    }

    if (rule.patterns) {
      for (const pattern of rule.patterns) {
        if (pattern.test(haystack)) {
          score += 2.5
          matchedTerms.push(`pattern:${rule.id}`)
        }
      }
    }

    if (rule.aliases) {
      for (const alias of rule.aliases) {
        if (containsTerm(haystack, alias)) {
          score += 1.5
          matchedTerms.push(alias)
        }
      }
    }

    const boost = rule.deviceBoost?.[device] ?? 1
    score *= boost

    if (score >= 2) {
      matches.push({
        ruleId: rule.id,
        label: rule.label,
        score,
        matchedTerms,
        probability: 0,
      })
    }
  }

  return matches
}

function applySynergies(
  matches: MatchedSymptom[],
  rules: HeuristicSymptomRule[],
): { matches: MatchedSymptom[]; notes: string[] } {
  const notes: string[] = []
  const ruleById = new Map(rules.map((r) => [r.id, r]))
  const ids = new Set(matches.map((m) => m.ruleId))

  const boosted = matches.map((m) => {
    const rule = ruleById.get(m.ruleId)
    if (!rule?.synergies) return m
    let bonus = 0
    for (const syn of rule.synergies) {
      if (ids.has(syn.symptomId)) {
        bonus += syn.bonus
        notes.push(`Synergie ${m.ruleId} + ${syn.symptomId} (+${syn.bonus})`)
      }
    }
    return bonus > 0 ? { ...m, score: m.score + bonus } : m
  })

  return { matches: boosted, notes }
}

function computeProbabilities(matches: MatchedSymptom[]): MatchedSymptom[] {
  const total = matches.reduce((s, m) => s + m.score, 0) || 1
  return matches
    .map((m) => ({ ...m, probability: Math.round((m.score / total) * 100) }))
    .sort((a, b) => b.score - a.score)
}

function pickForDevice(
  rule: HeuristicSymptomRule,
  field: 'causes' | 'components' | 'tests' | 'solutions',
  device: HeuristicDeviceCategory,
): string[] {
  const byDeviceKey = `${field}ByDevice` as const
  const byDevice = rule[byDeviceKey]?.[device]
  const base = rule[field] ?? []
  if (byDevice?.length) return [...new Set([...byDevice, ...base])]
  return base
}

function mergeUniqueItems(items: string[], limit = 12): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    const key = item.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
    if (out.length >= limit) break
  }
  return out
}

function resolveUrgency(matches: MatchedSymptom[], rules: HeuristicSymptomRule[]): HeuristicUrgency {
  const ruleById = new Map(rules.map((r) => [r.id, r]))
  let max: HeuristicUrgency = 'basse'
  for (const m of matches) {
    const rule = ruleById.get(m.ruleId)
    if (rule && URGENCY_RANK[rule.urgency] > URGENCY_RANK[max]) {
      max = rule.urgency
    }
  }
  return max
}

function resolveConfidence(
  deviceConfidencePercent: number,
  topSymptomProbability: number,
  symptomCount: number,
): { confidence: HeuristicConfidence; percent: number; note: string } {
  let percent = Math.round(deviceConfidencePercent * 0.45 + topSymptomProbability * 0.55)
  if (symptomCount >= 2) percent = Math.min(98, percent + 8)
  if (symptomCount >= 3) percent = Math.min(98, percent + 5)

  let confidence: HeuristicConfidence = 'faible'
  if (percent >= 85) confidence = 'critique'
  else if (percent >= 68) confidence = 'élevée'
  else if (percent >= 42) confidence = 'moyenne'

  const note =
    confidence === 'critique'
      ? 'Correspondance forte symptômes + profil appareil — valider par tests atelier.'
      : confidence === 'élevée'
        ? 'Piste fiable — confirmer par mesures / swap pièces.'
        : confidence === 'moyenne'
          ? 'Plusieurs hypothèses — affiner avec tests ciblés.'
          : 'Informations insuffisantes — compléter le symptôme ou le modèle.'

  return { confidence, percent, note }
}

function buildDiagnosticText(
  deviceLabel: string,
  issue: string,
  causes: string[],
  components: string[],
  urgency: HeuristicUrgency,
): string {
  const main = causes[0] ?? 'diagnostic à affiner après tests'
  const parts = components.slice(0, 3).join(', ') || 'composants à identifier'
  const urg =
    urgency === 'critique'
      ? 'Intervention urgente recommandée.'
      : urgency === 'haute'
        ? 'Prioriser le diagnostic sous 24-48 h.'
        : 'Délai standard atelier.'
  return `${deviceLabel} — ${issue}. Hypothèse principale : ${main}. Composants sous surveillance : ${parts}. ${urg}`
}

function buildExpertSummary(
  deviceLabel: string,
  symptoms: MatchedSymptom[],
  urgency: HeuristicUrgency,
): string {
  if (symptoms.length === 0) {
    return `Je n'ai pas encore identifié de symptôme précis pour ${deviceLabel}. Décrivez la panne avec plus de détails (allumage, écran, charge, bruit…).`
  }
  const main = symptoms[0]
  const secondary =
    symptoms.length > 1 ? `, combiné avec « ${symptoms[1].label} »` : ''
  const urgNote =
    urgency === 'critique'
      ? ' ⚠️ Niveau urgence **critique** — sécuriser l\'appareil immédiatement.'
      : urgency === 'haute'
        ? ' Priorité diagnostic élevée.'
        : ''
  return `D'après votre description, il s'agit probablement d'un problème **${main.label.toLowerCase()}**${secondary} sur ${deviceLabel}.${urgNote}`
}

export function analyzeWithHeuristicEngine(input: HeuristicEngineInput): HeuristicAnalysisResult {
  const start = performance.now()
  const fusionNotes: string[] = []

  const { expanded, matchedSynonyms } = expandSynonyms(
    [input.text, input.userMessage, input.contextText ?? ''].filter(Boolean).join(' '),
  )

  const historyText = input.historySummary ?? ''
  const detection = detectHeuristicDevice({
    primary: [input.text, input.userMessage].filter(Boolean).join(' '),
    context: input.contextText ?? '',
    capability: (input.capability as import('@/services/ai/types').AiCapability) ?? 'chat',
    historyText,
  })

  const device =
    input.forcedDeviceCategory && input.forcedDeviceCategory !== 'unknown'
      ? input.forcedDeviceCategory
      : detection.category
  const rules = getRulesForDevice(device)
  const candidates = getCandidateRules(rules, expanded)
  let matches = matchSymptoms(expanded, candidates.length > 0 ? candidates : rules, device)

  const synergy = applySynergies(matches, rules)
  matches = synergy.matches
  fusionNotes.push(...synergy.notes)

  if (input.historyLength && input.historyLength > 2 && matches.length > 0) {
    matches = matches.map((m, i) => (i === 0 ? { ...m, score: m.score * 1.08 } : m))
    fusionNotes.push('Bonus historique conversation (+8 % symptôme principal)')
  }

  matches = computeProbabilities(matches)

  const ruleById = new Map(rules.map((r) => [r.id, r]))

  if (input.existingDiagnostic?.trim() && matches.length > 0) {
    const diagNorm = normalizeHeuristicText(input.existingDiagnostic)
    matches = matches.map((m) => {
      const rule = ruleById.get(m.ruleId)
      if (!rule) return m
      const hit = rule.components.some((c) => diagNorm.includes(normalizeHeuristicText(c)))
      return hit ? { ...m, score: m.score * 1.06 } : m
    })
    fusionNotes.push('Contexte diagnostic existant — boost composants mentionnés')
    matches = computeProbabilities(matches)
  } else if (input.existingDiagnostic?.trim()) {
    fusionNotes.push('Diagnostic existant noté — symptômes à affiner')
  }

  const topMatches = matches.slice(0, 5)

  let causes = mergeUniqueItems(
    topMatches.flatMap((m) => pickForDevice(ruleById.get(m.ruleId)!, 'causes', device)),
  )
  let components = mergeUniqueItems(
    topMatches.flatMap((m) => pickForDevice(ruleById.get(m.ruleId)!, 'components', device)),
  )
  let tests = mergeUniqueItems(
    topMatches.flatMap((m) => pickForDevice(ruleById.get(m.ruleId)!, 'tests', device)),
  )
  const recommendations = mergeUniqueItems(
    topMatches.flatMap((m) => ruleById.get(m.ruleId)?.recommendations ?? []),
  )
  const solutions = mergeUniqueItems(
    topMatches.flatMap((m) => pickForDevice(ruleById.get(m.ruleId)!, 'solutions', device)),
  )

  const bundle = HEURISTIC_DEVICE_BY_CATEGORY.get(device)
  if (bundle) {
    tests.unshift(...bundle.profile.baselineTests.filter((t) => !tests.includes(t)).slice(0, 2))
    if (components.length < 4 && bundle.profile.frequentComponents) {
      components.push(...bundle.profile.frequentComponents.slice(0, 2))
    }
  }

  if (input.ragSnippets?.length) {
    const merged = mergeRagIntoAnalysis(causes, tests, components, input.ragSnippets)
    causes = merged.causes
    tests = merged.tests
    components = merged.components
    if (merged.ragNote) fusionNotes.push(merged.ragNote)
  }

  const urgency = resolveUrgency(matches, rules)
  const topProb = matches[0]?.probability ?? 0
  const conf = resolveConfidence(detection.confidencePercent, topProb, matches.length)

  const deviceLabel =
    HEURISTIC_DEVICE_BY_CATEGORY.get(device)?.profile.label ?? detection.label
  const diagnosticText = buildDiagnosticText(deviceLabel, input.text, causes, components, urgency)
  const expertSummary = buildExpertSummary(deviceLabel, matches, urgency)

  const durationMs = Math.round(performance.now() - start)
  const debug = {
    normalizedText: expanded,
    expandedSynonyms: matchedSynonyms,
    deviceScores: detection.scores,
    symptomScores: matches.map((m) => ({ id: m.ruleId, score: m.score, terms: m.matchedTerms })),
    fusionNotes,
    durationMs,
  }

  logHeuristicDebug(debug)

  return {
    device: { ...detection, category: device, label: deviceLabel },
    symptoms: matches,
    probableCauses: causes,
    suspectComponents: mergeUniqueItems(components, 10),
    testProcedures: mergeUniqueItems(tests, 10),
    recommendations: mergeUniqueItems(recommendations, 8),
    solutions: mergeUniqueItems(solutions, 6),
    diagnosticText,
    expertSummary,
    urgency,
    confidence: conf.confidence,
    confidencePercent: conf.percent,
    confidenceNote: conf.note,
    debug,
  }
}
