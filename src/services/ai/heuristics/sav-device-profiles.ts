import type { SavDeviceCategory, SavDeviceProfile } from '@/services/ai/heuristics/sav-types'
import { HEURISTIC_DEVICE_BUNDLES, HEURISTIC_DEVICE_BY_CATEGORY } from '@/data/heuristics/index'

export const SAV_DEVICE_PROFILES: SavDeviceProfile[] = HEURISTIC_DEVICE_BUNDLES.map((b) => ({
  category: b.profile.category as SavDeviceCategory,
  label: b.profile.label,
  keywords: b.profile.keywords,
  commonFailures: b.profile.commonFailures,
  baselineTests: b.profile.baselineTests,
  expertNote: b.profile.expertNote,
  frequentComponents: b.profile.frequentComponents,
}))

export const ALL_DEVICE_CATEGORIES: SavDeviceCategory[] = [
  'smartphone',
  'tablet',
  'laptop',
  'pc',
  'console',
  'printer',
  'network',
  'unknown',
]

export function getDeviceProfile(category: SavDeviceCategory): SavDeviceProfile | undefined {
  const bundle = HEURISTIC_DEVICE_BY_CATEGORY.get(category)
  if (!bundle) return undefined
  return SAV_DEVICE_PROFILES.find((p) => p.category === category)
}
