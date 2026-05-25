export const PART_CATEGORIES = [
  'Écran',
  'Batterie',
  'Connectique',
  'Carte mère',
  'Caméra',
  'Châssis',
  'Audio',
  'Autre',
] as const

export type PartCategory = (typeof PART_CATEGORIES)[number]
