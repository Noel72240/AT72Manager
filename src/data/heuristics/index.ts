import type { HeuristicDeviceBundle, HeuristicDeviceCategory, HeuristicSymptomRule } from '@/data/heuristics/types'
import { UNIVERSAL_SYMPTOM_RULES } from '@/data/heuristics/symptoms/universal'
import { EXTENDED_SYMPTOM_RULES } from '@/data/heuristics/symptoms/extended'
import { buildSymptomIndex, getIndexedRuleCount } from '@/data/heuristics/symptom-index'
import { PC_HEURISTICS } from '@/data/heuristics/pc'
import { LAPTOP_HEURISTICS } from '@/data/heuristics/laptop'
import { SMARTPHONE_HEURISTICS } from '@/data/heuristics/smartphone'
import { TABLET_HEURISTICS } from '@/data/heuristics/tablet'
import { CONSOLE_HEURISTICS } from '@/data/heuristics/console'
import { PRINTER_HEURISTICS } from '@/data/heuristics/printer'
import { NETWORK_HEURISTICS } from '@/data/heuristics/network'

export const HEURISTIC_DEVICE_BUNDLES: HeuristicDeviceBundle[] = [
  PC_HEURISTICS,
  LAPTOP_HEURISTICS,
  SMARTPHONE_HEURISTICS,
  TABLET_HEURISTICS,
  CONSOLE_HEURISTICS,
  PRINTER_HEURISTICS,
  NETWORK_HEURISTICS,
]

export const HEURISTIC_DEVICE_BY_CATEGORY = new Map<HeuristicDeviceCategory, HeuristicDeviceBundle>(
  HEURISTIC_DEVICE_BUNDLES.map((b) => [b.profile.category, b]),
)

let _allRulesCache: HeuristicSymptomRule[] | null = null

export function getAllSymptomRules(): HeuristicSymptomRule[] {
  if (_allRulesCache) return _allRulesCache
  const deviceRules = HEURISTIC_DEVICE_BUNDLES.flatMap((b) => b.extraSymptoms ?? [])
  _allRulesCache = [...UNIVERSAL_SYMPTOM_RULES, ...EXTENDED_SYMPTOM_RULES, ...deviceRules]
  buildSymptomIndex(_allRulesCache)
  return _allRulesCache
}

export function getRulesForDevice(category: HeuristicDeviceCategory): HeuristicSymptomRule[] {
  const bundle = HEURISTIC_DEVICE_BY_CATEGORY.get(category)
  const boosts = bundle?.symptomBoosts ?? {}
  return getAllSymptomRules().map((rule) => {
    const boost = boosts[rule.id] ?? 1
    if (boost === 1 && !rule.deviceBoost?.[category]) return rule
    return {
      ...rule,
      deviceBoost: { ...rule.deviceBoost, [category]: (rule.deviceBoost?.[category] ?? 1) * boost },
    }
  })
}

export function getHeuristicLibraryStats(): {
  universal: number
  extended: number
  deviceSpecific: number
  total: number
  indexed: number
} {
  const deviceSpecific = HEURISTIC_DEVICE_BUNDLES.flatMap((b) => b.extraSymptoms ?? []).length
  const total = getAllSymptomRules().length
  return {
    universal: UNIVERSAL_SYMPTOM_RULES.length,
    extended: EXTENDED_SYMPTOM_RULES.length,
    deviceSpecific,
    total,
    indexed: getIndexedRuleCount(),
  }
}

export {
  PC_HEURISTICS,
  LAPTOP_HEURISTICS,
  SMARTPHONE_HEURISTICS,
  TABLET_HEURISTICS,
  CONSOLE_HEURISTICS,
  PRINTER_HEURISTICS,
  NETWORK_HEURISTICS,
  UNIVERSAL_SYMPTOM_RULES,
  EXTENDED_SYMPTOM_RULES,
}
