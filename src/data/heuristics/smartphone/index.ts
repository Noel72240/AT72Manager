import type { HeuristicDeviceBundle } from '@/data/heuristics/types'
import { SMARTPHONE_SYMPTOM_RULES } from '@/data/heuristics/smartphone/symptoms'

export const SMARTPHONE_HEURISTICS: HeuristicDeviceBundle = {
  profile: {
    category: 'smartphone',
    label: 'Smartphone',
    keywords: [
      { term: 'iphone', weight: 3.5 },
      { term: 'smartphone', weight: 3 },
      { term: 'telephone', weight: 2.8 },
      { term: 'téléphone', weight: 2.8 },
      { term: 'samsung galaxy', weight: 3 },
      { term: 'android', weight: 2.5 },
      { term: 'xiaomi', weight: 2.8 },
      { term: 'pixel', weight: 2.8 },
      { term: 'huawei', weight: 2.5 },
      { term: 'oneplus', weight: 2.5 },
      { term: 'oppo', weight: 2.5 },
      { term: 'redmi', weight: 2.5 },
    ],
    commonFailures: ['Tristar/Hydra', 'Écran / vitre', 'Batterie', 'Bootloop', 'Charge port'],
    baselineTests: ['Amp draw charge', 'Recovery mode', 'Test known-good écran'],
    frequentComponents: ['Tristar', 'Batterie', 'Écran OLED', 'Port charge', 'Nappe'],
    expertNote: 'Mobile : distinguer charge IC vs batterie vs flex.',
  },
  symptomBoosts: {
    tristar_fault: 1.5,
    no_charge: 1.4,
    boot_loop: 1.3,
    touchscreen_fail: 1.35,
    battery_swell: 1.3,
    pmic_fault: 1.4,
    phone_ghost_touch: 1.35,
  },
  extraSymptoms: SMARTPHONE_SYMPTOM_RULES,
}

export { SMARTPHONE_SYMPTOM_RULES }
