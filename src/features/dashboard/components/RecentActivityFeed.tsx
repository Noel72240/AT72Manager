import { motion } from 'framer-motion'
import { AlertCircle, ClipboardList, Cpu, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { fadeInUp } from '@/utils/motion'
import { cn } from '@/utils/cn'
import type { ActivityItem } from '@/types/dashboard/dashboard.types'

type RecentActivityFeedProps = {
  items: ActivityItem[]
}

const activityIcons = {
  intervention: ClipboardList,
  client: Users,
  device: Cpu,
  sync: AlertCircle,
  alert: AlertCircle,
} as const

const activityColors = {
  intervention: 'text-neon-blue bg-primary-muted',
  client: 'text-neon-green bg-accent-muted',
  device: 'text-neon-blue bg-primary-muted',
  sync: 'text-warning bg-warning/10',
  alert: 'text-danger bg-danger/10',
} as const

export function RecentActivityFeed({ items }: RecentActivityFeedProps) {
  return (
    <Card title="Activité récente" description="Dernières actions sur votre atelier" hover>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">Aucune activité récente.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item, index) => {
            const Icon = activityIcons[item.type]
            const colorClass = activityColors[item.type]

            return (
              <motion.li
                key={item.id}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.04 }}
                className="group flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-surface-hover/60"
              >
                <div
                  className={cn(
                    'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
                    colorClass,
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs text-text-muted">{item.description}</p>
                </div>
                <time className="shrink-0 text-[11px] text-text-muted">{item.time}</time>
              </motion.li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
