import type { HeuristicDeviceBundle } from '@/data/heuristics/types'
import { LAPTOP_SYMPTOM_RULES } from '@/data/heuristics/laptop/symptoms'

export const LAPTOP_HEURISTICS: HeuristicDeviceBundle = {
  profile: {
    category: 'laptop',
    label: 'PC portable',
    keywords: [
      { term: 'portable', weight: 2.8 },
      { term: 'laptop', weight: 3 },
      { term: 'notebook', weight: 2.8 },
      { term: 'macbook', weight: 3.5 },
      { term: 'ultrabook', weight: 2.5 },
      { term: 'thinkpad', weight: 3 },
      { term: 'hp pavilion', weight: 2.5 },
      { term: 'asus zenbook', weight: 2.5 },
      { term: 'dell xps', weight: 2.5 },
      { term: 'ideapad', weight: 2.5 },
    ],
    commonFailures: ['DC jack', 'Batterie gonflée', 'Chauffe / ventilo', 'Dalle / charnière', 'SSD'],
    baselineTests: ['Test sans batterie sur chargeur', 'Écran externe HDMI', 'HWiNFO thermals'],
    frequentComponents: ['DC jack', 'Batterie', 'Ventilateur', 'Dalle eDP', 'SSD'],
    expertNote: 'Portable ≠ smartphone : « portable » seul oriente laptop, pas mobile.',
  },
  symptomBoosts: {
    overheat: 1.3,
    black_screen: 1.2,
    battery_swell: 1.35,
    slow_charge: 1.2,
    no_charge: 1.25,
    laptop_dc_jack: 1.4,
  },
  extraSymptoms: LAPTOP_SYMPTOM_RULES,
}

export { LAPTOP_SYMPTOM_RULES }
