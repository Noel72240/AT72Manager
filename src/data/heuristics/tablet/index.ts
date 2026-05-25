import type { HeuristicDeviceBundle } from '@/data/heuristics/types'
import { TABLET_SYMPTOM_RULES } from '@/data/heuristics/tablet/symptoms'

export const TABLET_HEURISTICS: HeuristicDeviceBundle = {
  profile: {
    category: 'tablet',
    label: 'Tablette',
    keywords: [
      { term: 'tablette', weight: 3.5 },
      { term: 'tablet', weight: 3.5 },
      { term: 'ipad', weight: 3.5 },
      { term: 'galaxy tab', weight: 3 },
      { term: 'surface', weight: 2.8 },
      { term: 'tab s', weight: 2.8 },
    ],
    commonFailures: ['Écran / tactile', 'Batterie', 'Charge', 'Bootloop', 'Connecteur'],
    baselineTests: ['Test charge amp', 'Mode recovery', 'Test tactile grille'],
    frequentComponents: ['Batterie', 'Digitizer', 'Port charge', 'Carte mère'],
  },
  symptomBoosts: {
    touchscreen_fail: 1.4,
    slow_charge: 1.25,
    boot_loop: 1.2,
    battery_swell: 1.25,
  },
  extraSymptoms: TABLET_SYMPTOM_RULES,
}

export { TABLET_SYMPTOM_RULES }
