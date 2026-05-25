/** Ligne de devis / facture (pièce ou main d'œuvre) */
export type CommercialLineKind = 'part' | 'labor'

export type CommercialLine = {
  id: string
  kind: CommercialLineKind
  description: string
  quantity: number
  unitPrice: number
  /** Taux TVA en % — 0 par défaut, prêt pour facturation TVA */
  vatRate: number
  /** Lien catalogue pièce détachée */
  partId?: string
  /** Coût d'achat unitaire (snapshot pour marge) */
  purchaseUnitCost?: number
}

export type DocumentTotals = {
  subtotal: number
  vatTotal: number
  total: number
}

export const DEFAULT_VAT_RATE = 20

export const LINE_KIND_LABELS: Record<CommercialLineKind, string> = {
  part: 'Pièce',
  labor: "Main d'œuvre",
}
