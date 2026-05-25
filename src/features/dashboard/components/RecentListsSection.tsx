import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Cpu, Smartphone, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { InterventionStatusBadge } from '@/modules/interventions/components/InterventionStatusBadge'
import { ROUTES } from '@/config/routes'
import { fadeInUp } from '@/utils/motion'
import { formatRelativeTime } from '@/features/dashboard/utils/relative-time'
import type {
  RecentClientRow,
  RecentDeviceRow,
  RecentInterventionRow,
} from '@/types/dashboard/dashboard.types'

type RecentListsSectionProps = {
  interventions: RecentInterventionRow[]
  clients: RecentClientRow[]
  devices: RecentDeviceRow[]
}

function SectionHeader({
  title,
  href,
  icon: Icon,
}: {
  title: string
  href: string
  icon: typeof Users
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-neon-blue" />
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <Link
        to={href}
        className="flex items-center gap-1 text-xs font-medium text-neon-blue hover:underline"
      >
        Voir tout
        <ArrowRight className="size-3" />
      </Link>
    </div>
  )
}

export function RecentListsSection({
  interventions,
  clients,
  devices,
}: RecentListsSectionProps) {
  return (
    <motion.div variants={fadeInUp} className="grid gap-6 lg:grid-cols-3">
      <Card hover className="flex flex-col">
        <SectionHeader title="Interventions récentes" href={ROUTES.INTERVENTIONS} icon={Smartphone} />
        {interventions.length === 0 ? (
          <p className="text-sm text-text-muted">Aucune intervention.</p>
        ) : (
          <ul className="space-y-3">
            {interventions.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-border/60 bg-surface-hover/20 px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-1 text-sm font-medium text-text-primary">
                    {row.clientName}
                  </p>
                  <InterventionStatusBadge status={row.status} />
                </div>
                <p className="mt-1 truncate text-xs text-text-muted">{row.summary}</p>
                <p className="mt-1 text-[10px] text-text-muted">
                  {formatRelativeTime(row.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card hover className="flex flex-col">
        <SectionHeader title="Clients récents" href={ROUTES.CLIENTS} icon={Users} />
        {clients.length === 0 ? (
          <p className="text-sm text-text-muted">Aucun client.</p>
        ) : (
          <ul className="space-y-3">
            {clients.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-border/60 bg-surface-hover/20 px-3 py-2.5"
              >
                <p className="text-sm font-medium text-text-primary">{row.name}</p>
                <p className="mt-1 text-xs text-text-muted">{row.phone ?? '—'}</p>
                <p className="mt-1 text-[10px] text-text-muted">
                  {formatRelativeTime(row.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card hover className="flex flex-col">
        <SectionHeader title="Appareils récents" href={ROUTES.DEVICES} icon={Cpu} />
        {devices.length === 0 ? (
          <p className="text-sm text-text-muted">Aucun appareil.</p>
        ) : (
          <ul className="space-y-3">
            {devices.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-border/60 bg-surface-hover/20 px-3 py-2.5"
              >
                <p className="line-clamp-1 text-sm font-medium text-text-primary">{row.summary}</p>
                <p className="mt-1 text-xs text-text-muted">{row.clientName}</p>
                <p className="mt-1 text-[10px] text-text-muted">
                  {row.condition} · {formatRelativeTime(row.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </motion.div>
  )
}

