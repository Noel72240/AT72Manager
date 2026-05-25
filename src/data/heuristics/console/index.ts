import type { HeuristicDeviceBundle } from '@/data/heuristics/types'
import { CONSOLE_SYMPTOM_RULES } from '@/data/heuristics/console/symptoms'

export const CONSOLE_HEURISTICS: HeuristicDeviceBundle = {
  profile: {
    category: 'console',
    label: 'Console de jeux',
    keywords: [
      { term: 'ps5', weight: 3.5 },
      { term: 'ps4', weight: 3.5 },
      { term: 'playstation', weight: 3.5 },
      { term: 'xbox', weight: 3.5 },
      { term: 'nintendo', weight: 3 },
      { term: 'switch', weight: 3 },
      { term: 'console', weight: 3 },
      { term: 'series x', weight: 3 },
    ],
    commonFailures: ['HDMI IC', 'Surchauffe APU', 'Alimentation', 'Lecteur disque', 'Joy-Con drift'],
    baselineTests: ['Safe mode', 'Test HDMI autre TV', 'Ventilation / poussière', 'Stockage externe'],
    frequentComponents: ['IC HDMI', 'Alimentation', 'Ventilateur', 'APU', 'Lecteur Blu-ray'],
    expertNote: 'PS4/PS5 : écran noir HDMI = souvent IC retimer.',
  },
  symptomBoosts: {
    hdmi_ic: 1.5,
    overheat: 1.4,
    black_screen: 1.3,
    power_no_boot: 1.15,
    console_hdmi_no_signal: 1.45,
  },
  extraSymptoms: CONSOLE_SYMPTOM_RULES,
}

export { CONSOLE_SYMPTOM_RULES }
