/** @deprecated Utiliser src/data/heuristics/ */
export type { SavDeviceCategory, SavSymptomRule } from '@/services/ai/heuristics/sav-types'
export { SAV_DEVICE_PROFILES } from '@/services/ai/heuristics/sav-device-profiles'
export { SAV_SYMPTOM_RULES } from '@/services/ai/heuristics/sav-symptom-rules'
export { analyzeWithHeuristicEngine } from '@/services/ai/heuristics/heuristic-engine'
export { getAllSymptomRules, HEURISTIC_DEVICE_BUNDLES, getHeuristicLibraryStats } from '@/data/heuristics/index'
export { registerHeuristicRagProvider } from '@/services/ai/heuristics/heuristic-rag'
