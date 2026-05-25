import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { STATUS_VARIANTS } from '@/modules/interventions/utils/intervention-labels'
import type { StatusChartItem } from '@/types/dashboard/dashboard.types'

type InterventionsByStatusChartProps = {
  items: StatusChartItem[]
  total: number
}

export function InterventionsByStatusChart({ items, total }: InterventionsByStatusChartProps) {
  const max = Math.max(...items.map((item) => item.count), 1)

  return (
    <Card
      title="Interventions par statut"
      description="Répartition du parc SAV en cours"
      hover
    >
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
          {items.map((item, index) => {
            const heightPx =
              total === 0 ? 4 : Math.max(8, Math.round((item.count / max) * 120))
            return (
              <div key={item.status} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-medium text-text-secondary">{item.count}</span>
                <div className="flex h-[120px] w-full items-end justify-center">
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: heightPx, opacity: 1 }}
                    transition={{ delay: 0.05 * index, duration: 0.45 }}
                    className={`w-full max-w-[48px] rounded-sm bg-linear-to-t ${item.colorClass}`}
                  />
                </div>
                <span className="hidden text-[9px] text-text-muted sm:block">{item.label}</span>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-4">
          {items.map((item) => (
            <Badge key={item.status} variant={STATUS_VARIANTS[item.status]}>
              {item.label} · {item.count}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  )
}
