import { motion } from 'framer-motion'
import type { BusinessDashboardMetrics } from '@/features/dashboard/utils/business-metrics'
import { fadeInUp } from '@/utils/motion'
import { cn } from '@/utils/cn'

type BusinessCockpitProps = {
  metrics: BusinessDashboardMetrics
}

function formatValue(value: number, format: BusinessDashboardMetrics['kpis'][0]['format']): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(value)
    case 'percent':
      return `${value.toFixed(0)} %`
    case 'duration':
      return value < 1 ? `${Math.round(value * 60)} min` : `${value.toFixed(1)} h`
    default:
      return String(Math.round(value))
  }
}

export function BusinessCockpitSection({ metrics }: BusinessCockpitProps) {
  const maxRevenue = Math.max(...metrics.revenueTrend.map((p) => p.revenue), 1)
  const maxLoad = Math.max(...metrics.workshopLoad.map((p) => p.scheduled), 1)

  return (
    <motion.section variants={fadeInUp} className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neon-blue">Cockpit business</p>
          <h3 className="text-lg font-semibold text-text-primary">Performance atelier</h3>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.kpis.map((kpi) => (
          <motion.div
            key={kpi.id}
            className="rounded-xl border border-border/60 bg-surface-elevated/60 p-4 transition-colors hover:border-neon-blue/20"
            whileHover={{ y: -1 }}
          >
            <p className="text-xs text-text-muted">{kpi.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">
              {formatValue(kpi.value, kpi.format)}
            </p>
            {kpi.hint ? (
              <p
                className={cn(
                  'mt-1 text-[11px]',
                  kpi.trend === 'up'
                    ? 'text-neon-green'
                    : kpi.trend === 'down'
                      ? 'text-danger'
                      : 'text-text-muted',
                )}
              >
                {kpi.hint}
              </p>
            ) : null}
          </motion.div>
        ))}
      </div>

      <motion.div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-surface-elevated/50 p-5">
          <h4 className="mb-4 text-sm font-semibold text-text-primary">CA & volume (6 mois)</h4>
          <div className="flex h-40 items-end gap-2">
            {metrics.revenueTrend.map((point) => (
              <div key={point.key} className="flex flex-1 flex-col items-center gap-1">
                <motion.div
                  className="w-full rounded-t-md bg-gradient-to-t from-neon-blue/80 to-neon-blue/30"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(8, (point.revenue / maxRevenue) * 100)}%` }}
                  transition={{ duration: 0.5, delay: 0.05 }}
                  title={`${point.revenue.toFixed(0)} € · ${point.interventions} int.`}
                />
                <span className="text-[10px] text-text-muted">{point.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-surface-elevated/50 p-5">
          <h4 className="mb-4 text-sm font-semibold text-text-primary">Charge planning (semaine)</h4>
          <div className="flex h-40 items-end gap-2">
            {metrics.workshopLoad.map((point) => (
              <div key={point.label} className="flex flex-1 flex-col items-center gap-1">
                <div className="relative flex w-full flex-col justify-end" style={{ height: '100%' }}>
                  <motion.div
                    className="w-full rounded-t bg-neon-blue/40"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(4, (point.scheduled / maxLoad) * 70)}%` }}
                    transition={{ duration: 0.4 }}
                  />
                  {point.urgent > 0 ? (
                    <motion.div
                      className="absolute bottom-0 w-full rounded-t bg-danger/70"
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(4, (point.urgent / maxLoad) * 70)}%` }}
                    />
                  ) : null}
                </div>
                <span className="text-[10px] text-text-muted">{point.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-text-muted">Bleu = planifié · Rouge = urgent</p>
        </div>
      </motion.div>

      {metrics.topIssues.length > 0 ? (
        <div className="rounded-xl border border-border/60 bg-surface-elevated/50 p-5">
          <h4 className="mb-3 text-sm font-semibold text-text-primary">Pannes fréquentes</h4>
          <ul className="space-y-2">
            {metrics.topIssues.map((issue) => (
              <li key={issue.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-text-secondary">{issue.label}</span>
                <span className="shrink-0 tabular-nums text-text-muted">{issue.count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </motion.section>
  )
}
