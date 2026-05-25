import type { HeuristicDeviceBundle } from '@/data/heuristics/types'
import { NETWORK_SYMPTOM_RULES } from '@/data/heuristics/network/symptoms'

export const NETWORK_HEURISTICS: HeuristicDeviceBundle = {
  profile: {
    category: 'network',
    label: 'Équipement réseau',
    keywords: [
      { term: 'routeur', weight: 3.5 },
      { term: 'box', weight: 3 },
      { term: 'switch', weight: 3 },
      { term: 'point d acces', weight: 3 },
      { term: 'ap wifi', weight: 2.8 },
      { term: 'repeater', weight: 2.5 },
      { term: 'mesh', weight: 2.5 },
      { term: 'freebox', weight: 3 },
      { term: 'livebox', weight: 3 },
      { term: 'bbox', weight: 3 },
      { term: 'nas', weight: 2.5 },
      { term: 'synology', weight: 2.8 },
    ],
    commonFailures: ['Firmware', 'Surchauffe', 'Alimentation 12V', 'Port WAN', 'Config DHCP'],
    baselineTests: ['Ping gateway', 'Cable direct PC', 'Reset config', 'Log système'],
    frequentComponents: ['Alimentation', 'Carte mère routeur', 'Antennes', 'Port WAN/LAN'],
    expertNote: 'Distinguer panne box vs client Wi-Fi vs câblage.',
  },
  symptomBoosts: {
    network_down: 1.7,
    overheat: 1.2,
    power_no_boot: 1.15,
    network_wan_down: 1.4,
  },
  extraSymptoms: NETWORK_SYMPTOM_RULES,
}

export { NETWORK_SYMPTOM_RULES }
