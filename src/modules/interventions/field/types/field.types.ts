import type { InterventionMedia } from '@/types/entities/intervention.types'

export type InterventionPdfKind = 'work_order' | 'sav_report'

export const PDF_KIND_LABELS: Record<InterventionPdfKind, string> = {
  work_order: "Bon d'intervention",
  sav_report: 'Rapport SAV',
}

export type InterventionFieldValues = {
  media: InterventionMedia
}

export const EMPTY_INTERVENTION_MEDIA: InterventionMedia = {
  photos: [],
  clientSignature: undefined,
  technicianSignature: undefined,
}

export const FUTURE_SAV_AUTOMATION = {
  quote: 'Devis automatique (à venir)',
  invoice: 'Facture automatique (à venir)',
  aiReport: 'Rapport IA (à venir)',
} as const

export const MAX_INTERVENTION_PHOTOS = 12
