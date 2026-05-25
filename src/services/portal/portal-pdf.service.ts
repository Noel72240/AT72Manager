import {
  downloadCommercialPdf,
  generateCommercialPdf,
} from '@/modules/commercial/services/commercial-pdf.service'
import {
  downloadInterventionPdf,
  generateInterventionPdf,
} from '@/modules/interventions/field/services/intervention-pdf.service'
import {
  QUOTE_STATUS_LABELS,
  INVOICE_STATUS_LABELS,
} from '@/modules/commercial/utils/commercial-labels'
import type { Client, Intervention, Invoice, Quote } from '@/types/entities'

export const portalPdfService = {
  async downloadQuotePdf(quote: Quote, client: Client): Promise<void> {
    const blob = await generateCommercialPdf({
      kind: 'quote',
      document: quote,
      client,
      statusLabel: QUOTE_STATUS_LABELS[quote.status],
    })
    downloadCommercialPdf(blob, `at72-devis-${quote.number}.pdf`)
  },

  async downloadInvoicePdf(invoice: Invoice, client: Client): Promise<void> {
    const blob = await generateCommercialPdf({
      kind: 'invoice',
      document: invoice,
      client,
      statusLabel: INVOICE_STATUS_LABELS[invoice.status],
    })
    downloadCommercialPdf(blob, `at72-facture-${invoice.number}.pdf`)
  },

  async downloadSavReport(intervention: Intervention, client: Client): Promise<void> {
    const blob = await generateInterventionPdf({
      intervention,
      client,
      kind: 'sav_report',
    })
    downloadInterventionPdf(blob, `at72-rapport-sav-${intervention.id.slice(0, 8)}.pdf`)
  },
}
