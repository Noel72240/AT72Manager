import { useCallback, useState } from 'react'
import type { Client, Invoice, Quote } from '@/types/entities'
import {
  QUOTE_STATUS_LABELS,
  INVOICE_STATUS_LABELS,
} from '@/modules/commercial/utils/commercial-labels'
import {
  downloadCommercialPdf,
  generateCommercialPdf,
  type CommercialPdfKind,
} from '@/modules/commercial/services/commercial-pdf.service'
import { toast } from '@/store/toast.store'
import { useAuthStore } from '@/store/auth.store'
import { emitFeedItem } from '@/features/notifications/services/feed.service'

type ExportTarget = {
  kind: CommercialPdfKind
  document: Quote | Invoice
  client: Client | undefined
}

export function useCommercialPdfExport() {
  const [exportingId, setExportingId] = useState<string | null>(null)

  const exportPdf = useCallback(async ({ kind, document, client }: ExportTarget) => {
    if (!client) {
      toast.error('PDF impossible', 'Client introuvable pour ce document.')
      return
    }

    setExportingId(document.id)
    try {
      const statusLabel =
        kind === 'quote'
          ? QUOTE_STATUS_LABELS[document.status as Quote['status']]
          : INVOICE_STATUS_LABELS[document.status as Invoice['status']]

      const blob = await generateCommercialPdf({
        kind,
        document,
        client,
        statusLabel,
      })

      const prefix = kind === 'quote' ? 'devis' : 'facture'
      const date = new Date().toISOString().slice(0, 10)
      downloadCommercialPdf(blob, `at72-${prefix}-${document.number}-${date}.pdf`)
      const userId = useAuthStore.getState().user?.id
      if (userId) {
        await emitFeedItem(userId, {
          kind: 'pdf_generated',
          title: `PDF ${kind === 'quote' ? 'devis' : 'facture'} généré`,
          message: document.number,
          entityType: kind,
          entityId: document.id,
        })
      }
      toast.success('PDF généré', document.number)
    } catch (error) {
      toast.error(
        'Export PDF impossible',
        error instanceof Error ? error.message : 'Une erreur est survenue.',
      )
    } finally {
      setExportingId(null)
    }
  }, [])

  return { exportPdf, exportingId }
}
