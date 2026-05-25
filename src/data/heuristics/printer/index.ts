import type { HeuristicDeviceBundle } from '@/data/heuristics/types'
import { PRINTER_SYMPTOM_RULES } from '@/data/heuristics/printer/symptoms'

export const PRINTER_HEURISTICS: HeuristicDeviceBundle = {
  profile: {
    category: 'printer',
    label: 'Imprimante',
    keywords: [
      { term: 'imprimante', weight: 3.5 },
      { term: 'printer', weight: 3 },
      { term: 'hp laserjet', weight: 3 },
      { term: 'epson', weight: 2.8 },
      { term: 'brother', weight: 2.8 },
      { term: 'canon pixma', weight: 2.8 },
      { term: 'jet d encre', weight: 2.5 },
      { term: 'laser', weight: 2 },
      { term: 'multifonction', weight: 2.5 },
    ],
    commonFailures: ['Bourrage papier', 'Tête encré', 'Fusor', 'Rouleaux', 'Wi-Fi imprimante'],
    baselineTests: ['Test page', 'Nettoyage têtes', 'Compteur maintenance', 'Alignement'],
    frequentComponents: ['Rouleaux', 'Fusor', 'Cartouche', 'Courroie', 'Capteur papier'],
  },
  symptomBoosts: {
    printer_jam: 1.6,
    network_down: 1.2,
    printer_paper_feed: 1.4,
  },
  extraSymptoms: PRINTER_SYMPTOM_RULES,
}

export { PRINTER_SYMPTOM_RULES }
