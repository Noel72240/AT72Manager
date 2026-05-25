import type { HeuristicDeviceBundle } from '@/data/heuristics/types'
import { PC_SYMPTOM_RULES } from '@/data/heuristics/pc/symptoms'

export const PC_HEURISTICS: HeuristicDeviceBundle = {
  profile: {
    category: 'pc',
    label: 'PC fixe / tour',
    keywords: [
      { term: 'pc fixe', weight: 3.5 },
      { term: 'tour', weight: 3 },
      { term: 'unité centrale', weight: 3 },
      { term: 'bureau', weight: 2 },
      { term: 'gaming', weight: 2.5 },
      { term: 'gamer', weight: 2.5 },
      { term: 'setup gaming', weight: 3 },
      { term: 'pc gamer', weight: 3.2 },
      { term: 'rtx', weight: 2 },
      { term: 'ryzen', weight: 2 },
      { term: 'intel core', weight: 2 },
      { term: 'atx', weight: 2.5 },
      { term: 'psu', weight: 2 },
      { term: 'carte graphique', weight: 2.5 },
      { term: 'gpu', weight: 2 },
      { term: 'msi', weight: 1.8 },
      { term: 'asus rog', weight: 2 },
    ],
    commonFailures: ['PSU mort', 'RAM instable', 'GPU artefacts', 'SSD SMART fail', 'Surchauffe CPU'],
    baselineTests: ['Paperclip PSU', 'POST minimal (1 RAM)', 'SMART disque', 'Temp idle/load'],
    frequentComponents: ['PSU', 'GPU', 'RAM', 'SSD', 'Carte mère'],
    expertNote: 'PC fixe : isoler PSU avant carte mère. Gaming = vérifier wattage PSU vs GPU.',
  },
  symptomBoosts: {
    power_no_boot: 1.25,
    psu_dead: 1.4,
    gpu_artifacts: 1.35,
    bsod: 1.2,
    ram_fault: 1.15,
    corrupt_bios: 1.2,
    motherboard_dead: 1.3,
  },
  extraSymptoms: PC_SYMPTOM_RULES,
}

export { PC_SYMPTOM_RULES }
