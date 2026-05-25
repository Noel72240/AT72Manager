import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { fadeInUp } from '@/utils/motion'
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { DashboardStat } from '@/types'

type StatCardProps = {
  stat: DashboardStat
}

export function StatCard({ stat }: StatCardProps) {
  const Icon = stat.icon
  const isPositive = stat.trend === 'up'
  const formattedValue =
    stat.format === 'currency'
      ? formatCurrency(stat.value)
      : formatNumber(stat.value)
  const showChange = stat.change !== undefined && stat.trend !== undefined

  return (
    <motion.article
      variants={fadeInUp}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border p-5 shadow-card glass-elevated',
        'transition-all duration-300 hover:border-glow hover:shadow-card-hover',
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -right-6 -top-6 size-28 rounded-full blur-2xl transition-opacity duration-300',
          stat.accent === 'blue'
            ? 'bg-neon-blue/10 group-hover:bg-neon-blue/15'
            : 'bg-neon-green/10 group-hover:bg-neon-green/15',
        )}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            {stat.label}
          </p>
          <p className="text-2xl font-semibold tracking-tight text-text-primary">
            {formattedValue}
          </p>
          {showChange ? (
            <div
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                isPositive
                  ? 'bg-accent-muted text-accent'
                  : stat.trend === 'down'
                    ? 'bg-danger/10 text-danger'
                    : 'bg-surface-hover text-text-muted',
              )}
            >
              {stat.trend === 'up' ? (
                <ArrowUpRight className="size-3" />
              ) : stat.trend === 'down' ? (
                <ArrowDownRight className="size-3" />
              ) : null}
              {formatPercent(stat.change!)}
            </div>
          ) : stat.hint ? (
            <p className="text-xs text-text-muted">{stat.hint}</p>
          ) : null}
        </div>

        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 transition-all duration-300',
            stat.accent === 'blue'
              ? 'bg-primary-muted text-neon-blue ring-neon-blue/20 group-hover:glow-blue'
              : 'bg-accent-muted text-neon-green ring-neon-green/20 group-hover:glow-green',
          )}
        >
          <Icon className="size-[18px]" strokeWidth={1.75} />
        </div>
      </div>
    </motion.article>
  )
}
