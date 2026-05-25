/** @deprecated Utiliser heuristic-device-detector.ts et text-normalizer.ts */
export {
  detectHeuristicDevice as detectDeviceCategory,
  normalizeHeuristicText as normalizeSavText,
  expandSynonyms,
  containsTerm,
} from '@/services/ai/heuristics/heuristic-device-detector'
export type { DetectionSources } from '@/services/ai/heuristics/heuristic-device-detector'
