import type { SavTrendInsight } from '@/services/ai/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BarChart3, Package, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

type AiTrendsCardProps = {
  trends: SavTrendInsight | null
  loading?: boolean
}

export function AiTrendsCard({ trends, loading }: AiTrendsCardProps) {
  if (loading) {
    return (
      <Card className="animate-pulse p-5">
        <div className="h-4 w-32 rounded bg-surface-hover" />
        <div className="mt-4 h-20 rounded bg-surface-hover" />
      </Card>
    )
  }

  if (!trends) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-neon-green/10 bg-linear-to-br from-surface-elevated to-neon-green/5 p-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-neon-green" />
          <h3 className="text-sm font-semibold text-text-primary">Intelligence SAV</h3>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-text-muted">{trends.summary}</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <section>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              <AlertTriangle className="size-3.5" />
              Pannes fréquentes
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trends.frequentIssues.length === 0 ? (
                <span className="text-xs text-text-muted">—</span>
              ) : (
                trends.frequentIssues.slice(0, 5).map((item) => (
                  <Badge key={item.label} variant="default">
                    {item.label} · {item.count}
                  </Badge>
                ))
              )}
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              <Package className="size-3.5" />
              Pièces récurrentes
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trends.recurringParts.length === 0 ? (
                <span className="text-xs text-text-muted">—</span>
              ) : (
                trends.recurringParts.slice(0, 5).map((item) => (
                  <Badge key={item.name} variant="primary">
                    {item.name} · {item.count}
                  </Badge>
                ))
              )}
            </div>
          </section>
        </div>
      </Card>
    </motion.div>
  )
}
