import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, Info, Package } from 'lucide-react'
import type { DashboardAlert } from '@/types/dashboard/dashboard.types'
import { cn } from '@/utils/cn'
import { fadeInUp } from '@/utils/motion'

type DashboardAlertsProps = {
  alerts: DashboardAlert[]
}

const icons = {
  info: Info,
  warning: Package,
  danger: AlertTriangle,
} as const

const styles = {
  info: 'border-neon-blue/30 bg-primary-muted/30 text-neon-blue',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  danger: 'border-danger/30 bg-danger/10 text-danger',
} as const

export function DashboardAlerts({ alerts }: DashboardAlertsProps) {
  if (alerts.length === 0) return null

  return (
    <motion.div variants={fadeInUp} className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        Alertes intelligentes
      </h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {alerts.map((alert) => {
          const Icon = icons[alert.severity]
          const content = (
            <div
              className={cn(
                'flex items-start gap-3 rounded-xl border px-3 py-3 transition-colors',
                styles[alert.severity],
                alert.href && 'hover:brightness-110',
              )}
            >
              <Icon className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">{alert.title}</p>
                <p className="mt-0.5 text-xs text-text-muted">{alert.description}</p>
              </div>
            </div>
          )

          return alert.href ? (
            <Link key={alert.id} to={alert.href} className="block">
              {content}
            </Link>
          ) : (
            <div key={alert.id}>{content}</div>
          )
        })}
      </div>
    </motion.div>
  )
}
