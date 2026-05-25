import { useCallback, useState } from 'react'
import type { Client } from '@/types/entities'
import type { Intervention } from '@/types/entities/intervention.types'
import type { InterventionPdfKind } from '@/modules/interventions/field/types/field.types'
import { PDF_KIND_LABELS } from '@/modules/interventions/field/types/field.types'
import {
  downloadInterventionPdf,
  generateInterventionPdf,
} from '@/modules/interventions/field/services/intervention-pdf.service'
import { toast } from '@/store/toast.store'
import { useAuthStore } from '@/store/auth.store'
import { emitFeedItem } from '@/features/notifications/services/feed.service'

export function useInterventionPdfExport() {
  const [exportingId, setExportingId] = useState<string | null>(null)

  const exportPdf = useCallback(
    async (intervention: Intervention, client: Client | undefined, kind: InterventionPdfKind) => {
      if (!client) {
        toast.error('Export impossible', 'Client introuvable pour cette intervention.')
        return
      }

      setExportingId(`${intervention.id}-${kind}`)
      try {
        const blob = await generateInterventionPdf({ intervention, client, kind })
        const slug = PDF_KIND_LABELS[kind].toLowerCase().replace(/\s+/g, '-')
        const date = new Date().toISOString().slice(0, 10)
        downloadInterventionPdf(blob, `at72-${slug}-${date}.pdf`)
        const userId = useAuthStore.getState().user?.id
        if (userId) {
          await emitFeedItem(userId, {
            kind: 'pdf_generated',
            title: 'PDF intervention généré',
            message: `${PDF_KIND_LABELS[kind]} · ${intervention.reportedIssue.slice(0, 80)}`,
            entityType: 'intervention',
            entityId: intervention.id,
          })
        }
        toast.success('PDF généré', PDF_KIND_LABELS[kind])
      } catch (error) {
        toast.error(
          'Export PDF impossible',
          error instanceof Error ? error.message : 'Une erreur est survenue.',
        )
      } finally {
        setExportingId(null)
      }
    },
    [],
  )

  const isExporting = (interventionId: string, kind?: InterventionPdfKind) => {
    if (!exportingId) return false
    if (kind) return exportingId === `${interventionId}-${kind}`
    return exportingId.startsWith(interventionId)
  }

  return { exportPdf, exportingId, isExporting }
}
