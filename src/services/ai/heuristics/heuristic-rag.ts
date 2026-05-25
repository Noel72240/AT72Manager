/**
 * Hook RAG — compatibilité future documentation SAV / modèles locaux.
 * Brancher un provider externe via registerHeuristicRagProvider().
 */
import type { HeuristicDeviceCategory } from '@/data/heuristics/types'

export type HeuristicRagSnippet = {
  text: string
  weight: number
  source?: string
  componentHints?: string[]
  testHints?: string[]
}

export type HeuristicRagQuery = {
  issue: string
  deviceCategory: HeuristicDeviceCategory
  matchedSymptomIds?: string[]
  limit?: number
}

export type HeuristicRagProvider = {
  name: string
  search(query: HeuristicRagQuery): Promise<HeuristicRagSnippet[]> | HeuristicRagSnippet[]
}

let _provider: HeuristicRagProvider | null = null

export function registerHeuristicRagProvider(provider: HeuristicRagProvider | null): void {
  _provider = provider
}

export function getHeuristicRagProvider(): HeuristicRagProvider | null {
  return _provider
}

export async function fetchRagSnippets(query: HeuristicRagQuery): Promise<HeuristicRagSnippet[]> {
  if (!_provider) return []
  try {
    const result = await _provider.search(query)
    return result.slice(0, query.limit ?? 5)
  } catch {
    return []
  }
}

export function mergeRagIntoAnalysis(
  causes: string[],
  tests: string[],
  components: string[],
  snippets: HeuristicRagSnippet[],
): { causes: string[]; tests: string[]; components: string[]; ragNote?: string } {
  if (snippets.length === 0) return { causes, tests, components }

  const ragCauses = snippets.filter((s) => s.text.length > 10).map((s) => `[Doc] ${s.text}`)
  const ragTests = snippets.flatMap((s) => s.testHints ?? [])
  const ragComponents = snippets.flatMap((s) => s.componentHints ?? [])

  return {
    causes: [...new Set([...causes, ...ragCauses])].slice(0, 12),
    tests: [...new Set([...tests, ...ragTests])].slice(0, 12),
    components: [...new Set([...components, ...ragComponents])].slice(0, 10),
    ragNote: `Enrichi par ${_provider?.name ?? 'RAG'} (${snippets.length} extrait(s))`,
  }
}
