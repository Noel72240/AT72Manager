import {
  downloadInterventionPdf,
  generateInterventionPdf,
} from '@/modules/interventions/field/services/intervention-pdf.service'
import type { Client, Intervention } from '@/types/entities'

export const portalPdfService = {
  async downloadSavReport(intervention: Intervention, client: Client): Promise<void> {
    const blob = await generateInterventionPdf({
      intervention,
      client,
      kind: 'sav_report',
    })
    downloadInterventionPdf(blob, `at72-rapport-sav-${intervention.id.slice(0, 8)}.pdf`)
  },
}
