import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, History, MessageCircle, Wrench } from 'lucide-react'
import { PORTAL_ROUTES } from '@/config/portal.routes'
import { usePortalAuthStore } from '@/store/portal-auth.store'
import { usePortalDataStore } from '@/store/portal-data.store'
import { PortalFutureFeatures } from '@/modules/portal/components/PortalFutureFeatures'
import { RepairTimeline } from '@/modules/portal/components/RepairTimeline'
import { buildRepairTimeline, getTimelineProgress } from '@/services/portal/portal-timeline.service'
import { STATUS_LABELS } from '@/modules/interventions/utils/intervention-labels'
import { cn } from '@/utils/cn'

export function PortalDashboardPage() {
  const session = usePortalAuthStore((s) => s.session)
  const interventions = usePortalDataStore((s) => s.interventions)
  const notifications = usePortalDataStore((s) => s.notifications)
  const repairEvents = usePortalDataStore((s) => s.repairEvents)
  const loading = usePortalDataStore((s) => s.loading)

  const active = interventions.filter((i) => !['returned', 'completed'].includes(i.status))[0]
  const timeline = active
    ? buildRepairTimeline(
        active,
        repairEvents.filter((e) => e.interventionId === active.id),
      )
    : []
  const progress = timeline.length ? getTimelineProgress(timeline) : 0
  const unreadNotifs = notifications.filter((n) => !n.readAt).length

  return (
    <div className="portal-page portal-safe-bottom mx-auto max-w-5xl space-y-6 p-4 pb-12 lg:p-8">
      <header>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold text-text-primary"
        >
          Bonjour{session ? `, ${session.fullName.split(' ')[0]}` : ''}
        </motion.h1>
        <p className="mt-1 text-sm text-text-secondary">
          Suivez vos réparations et rendez-vous en temps réel.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Réparations actives', value: interventions.filter((i) => !['returned'].includes(i.status)).length, icon: Wrench, to: PORTAL_ROUTES.INTERVENTIONS },
          { label: 'Historique', value: interventions.length, icon: History, to: PORTAL_ROUTES.HISTORY },
          { label: 'Notifications', value: unreadNotifs, icon: MessageCircle, to: PORTAL_ROUTES.NOTIFICATIONS },
          { label: 'Prochains RDV', value: interventions.filter((i) => i.scheduledAt).length, icon: Calendar, to: PORTAL_ROUTES.APPOINTMENTS },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link
              to={card.to}
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated/80 p-4 transition hover:border-neon-blue/30 hover:shadow-[0_0_24px_rgba(0,207,255,0.08)]"
            >
              <div className="rounded-xl bg-neon-blue/10 p-3 text-neon-blue">
                <card.icon className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums text-text-primary">{card.value}</p>
                <p className="text-xs text-text-muted">{card.label}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {active ? (
        <section className="rounded-2xl border border-border bg-surface-elevated p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-neon-blue">
                Réparation en cours
              </p>
              <h2 className="mt-1 text-lg font-semibold text-text-primary">
                {active.deviceLabel || active.brand || 'Appareil'}
              </h2>
              <p className="text-sm text-text-secondary">{active.reportedIssue}</p>
            </div>
            <span className="rounded-full border border-neon-blue/30 bg-neon-blue/10 px-3 py-1 text-xs font-medium text-neon-blue">
              {STATUS_LABELS[active.status]}
            </span>
          </div>
          <RepairTimeline steps={timeline} progress={progress} compact />
          <Link
            to={PORTAL_ROUTES.INTERVENTION_DETAIL.replace(':id', active.id)}
            className="mt-4 inline-block text-sm font-medium text-neon-blue hover:underline"
          >
            Voir le détail →
          </Link>
        </section>
      ) : (
        <p className={cn('rounded-2xl border border-border p-6 text-sm text-text-muted', loading && 'animate-pulse')}>
          Aucune réparation active pour le moment.
        </p>
      )}

      <PortalFutureFeatures />
    </div>
  )
}
