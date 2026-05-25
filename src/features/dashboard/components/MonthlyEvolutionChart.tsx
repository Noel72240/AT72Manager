import { motion } from 'framer-motion'
import { Activity, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { MonthlyChartPoint } from '@/types/dashboard/dashboard.types'

type MonthlyEvolutionChartProps = {
  points: MonthlyChartPoint[]
}

export function MonthlyEvolutionChart({ points }: MonthlyEvolutionChartProps) {
  const max = Math.max(...points.map((point) => point.count), 1)
  const total = points.reduce((sum, point) => sum + point.count, 0)
  const lastMonth = points[points.length - 1]?.count ?? 0
  const prevMonth = points[points.length - 2]?.count ?? 0
  const trend =
    prevMonth === 0 ? (lastMonth > 0 ? 100 : 0) : ((lastMonth - prevMonth) / prevMonth) * 100

  return (
    <Card
      title="Évolution mensuelle"
      description="Nouvelles interventions sur 12 mois"
      hover
    >
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-1" style={{ height: 140 }}>
          {points.map((point, index) => {
            const heightPx = Math.max(point.count > 0 ? 10 : 4, Math.round((point.count / max) * 120))
            return (
              <div key={point.key} className="group flex flex-1 flex-col items-center gap-1">
                <div className="flex h-[120px] w-full items-end justify-center">
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: heightPx, opacity: 1 }}
                    transition={{ delay: 0.04 * index, duration: 0.5 }}
                    title={`${point.label}: ${point.count}`}
                    className="w-full rounded-sm bg-linear-to-t from-neon-blue/15 to-neon-blue/80 transition-all group-hover:from-neon-blue/25 group-hover:to-neon-blue"
                  />
                </div>
                <span className="hidden text-[9px] text-text-muted sm:block">{point.label}</span>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between border-t border-border-subtle pt-4">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Activity className="size-3.5 text-neon-blue" />
            <span>{total} interventions sur la période</span>
          </div>
          {lastMonth > 0 ? (
            <div
              className={`flex items-center gap-1.5 text-xs font-medium ${
                trend >= 0 ? 'text-accent' : 'text-danger'
              }`}
            >
              <TrendingUp className="size-3.5" />
              {trend >= 0 ? '+' : ''}
              {trend.toFixed(0)} % vs mois préc.
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
