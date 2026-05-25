import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Smartphone } from 'lucide-react'
import { PORTAL_ROUTES } from '@/config/portal.routes'
import { usePortalDataStore } from '@/store/portal-data.store'
import { STATUS_LABELS } from '@/modules/interventions/utils/intervention-labels'
import { buildRepairTimeline, getTimelineProgress } from '@/services/portal/portal-timeline.service'
import { RepairTimeline } from '@/modules/portal/components/RepairTimeline'

export function PortalInterventionsPage() {
  const interventions = usePortalDataStore((s) => s.interventions)
  const repairEvents = usePortalDataStore((s) => s.repairEvents)

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 pb-12 lg:p-8">
      <h1 className="text-2xl font-semibold text-text-primary">Mes réparations</h1>
      <p className="text-sm text-text-secondary">
        Suivi en temps réel de vos interventions SAV.
      </p>

      <div className="space-y-4">
        {interventions.length === 0 ? (
          <p className="rounded-2xl border border-border p-8 text-center text-sm text-text-muted">
            Aucune intervention pour le moment.
          </p>
        ) : (
          interventions.map((item, index) => {
            const events = repairEvents.filter((e) => e.interventionId === item.id)
            const steps = buildRepairTimeline(item, events)
            const progress = getTimelineProgress(steps)

            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-2xl border border-border bg-surface-elevated p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="rounded-xl bg-neon-blue/10 p-2.5 text-neon-blue">
                      <Smartphone className="size-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-text-primary">
                        {item.deviceLabel || `${item.brand ?? ''} ${item.model ?? ''}`.trim() || 'Appareil'}
                      </h2>
                      <p className="text-sm text-text-secondary">{item.reportedIssue}</p>
                      <p className="mt-1 text-xs text-neon-blue">{STATUS_LABELS[item.status]}</p>
                    </div>
                  </div>
                  <Link
                    to={PORTAL_ROUTES.INTERVENTION_DETAIL.replace(':id', item.id)}
                    className="flex items-center gap-1 text-sm text-neon-blue hover:underline"
                  >
                    Détail
                    <ChevronRight className="size-4" />
                  </Link>
                </div>
                <div className="mt-4">
                  <RepairTimeline steps={steps} progress={progress} compact />
                </div>
              </motion.article>
            )
          })
        )}
      </div>
    </div>
  )
}
