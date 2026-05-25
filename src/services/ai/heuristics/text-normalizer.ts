import { SAV_SYNONYM_MAP, SAV_TYPO_FIXES } from '@/data/heuristics/synonyms'

/** Normalise texte atelier : accents, espaces, apostrophes */
export function normalizeHeuristicText(value: string): string {
  let text = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[''`]/g, ' ')
    .replace(/[^\w\s+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  for (const [pattern, replacement] of SAV_TYPO_FIXES) {
    text = text.replace(pattern, replacement)
  }
  return text
}

/** Étend le texte avec synonymes détectés (pour matching) */
export function expandSynonyms(text: string): { expanded: string; matchedSynonyms: string[] } {
  const normalized = normalizeHeuristicText(text)
  const extras: string[] = []
  const matchedSynonyms: string[] = []

  for (const [canonical, variants] of Object.entries(SAV_SYNONYM_MAP)) {
    const canonNorm = normalizeHeuristicText(canonical)
    const hit =
      normalized.includes(canonNorm) ||
      variants.some((v) => normalized.includes(normalizeHeuristicText(v)))
    if (hit) {
      extras.push(canonNorm, ...variants.map(normalizeHeuristicText))
      matchedSynonyms.push(canonical)
    }
  }

  const expanded = [normalized, ...extras].join(' ')
  return { expanded, matchedSynonyms }
}

export function containsTerm(haystack: string, term: string): boolean {
  const normalizedTerm = normalizeHeuristicText(term)
  if (normalizedTerm.length <= 3) {
    return haystack.split(' ').includes(normalizedTerm)
  }
  return haystack.includes(normalizedTerm)
}
