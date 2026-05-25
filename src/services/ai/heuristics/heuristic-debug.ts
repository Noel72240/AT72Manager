import type { HeuristicDebugTrace } from '@/data/heuristics/types'

const DEBUG_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_AI_DEBUG === 'true' || import.meta.env.VITE_AI_DEBUG === '1'

let lastTrace: HeuristicDebugTrace | null = null

export function logHeuristicDebug(trace: HeuristicDebugTrace): void {
  lastTrace = trace
  if (!DEBUG_ENABLED) return

  console.groupCollapsed(`[AT72 SAV Expert] analyse ${trace.durationMs}ms`)
  console.log('Texte normalisé:', trace.normalizedText.slice(0, 200))
  if (trace.expandedSynonyms.length) console.log('Synonymes:', trace.expandedSynonyms)
  console.table(trace.deviceScores)
  console.table(trace.symptomScores)
  if (trace.fusionNotes.length) console.log('Fusion:', trace.fusionNotes)
  console.groupEnd()
}

export function getLastHeuristicDebugTrace(): HeuristicDebugTrace | null {
  return lastTrace
}
