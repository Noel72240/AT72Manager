import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert } from 'lucide-react'
import { securityLogService } from '@/services/audit/security-log.service'
import { useAuthStore } from '@/store/auth.store'
import type { SecurityLogEntry } from '@/types/audit.types'
import { cn } from '@/utils/cn'
import { fadeInUp } from '@/utils/motion'

const SEVERITY_STYLES = {
  info: 'text-neon-blue ring-neon-blue/20 bg-primary-muted/40',
  warning: 'text-warning ring-warning/20 bg-warning/10',
  critical: 'text-danger ring-danger/20 bg-danger/10',
} as const

export function SecurityLogsPanel() {
  const workshopId = useAuthStore((state) => state.user?.workshopId)
  const [entries, setEntries] = useState<SecurityLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workshopId) return
    setLoading(true)
    void securityLogService.list(workshopId, 60).then((data) => {
      setEntries(data)
      setLoading(false)
    })
  }, [workshopId])

  return (
    <motion.section variants={fadeInUp} className="space-y-4">
      <div className="flex items-center gap-3">
        <motion.div className="flex size-10 items-center justify-center rounded-xl bg-primary-muted ring-1 ring-neon-blue/25">
          <ShieldAlert className="size-5 text-neon-blue" />
        </motion.div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Logs sécurité</h2>
          <p className="text-sm text-text-muted">
            Connexions, refus d&apos;accès et événements sensibles.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-surface-elevated/60">
        {loading ? (
          <p className="px-4 py-8 text-sm text-text-muted">Chargement…</p>
        ) : entries.length === 0 ? (
          <p className="px-4 py-8 text-sm text-text-muted">Aucun événement de sécurité.</p>
        ) : (
          <ul className="max-h-[420px] divide-y divide-border/50 overflow-y-auto">
            {entries.map((entry, index) => (
              <motion.li
                key={entry.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className="flex items-start gap-3 px-4 py-3"
              >
                <span
                  className={cn(
                    'mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1',
                    SEVERITY_STYLES[entry.severity],
                  )}
                >
                  {entry.severity}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-primary">{entry.message}</p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {entry.eventType}
                    {entry.deviceLabel ? ` · ${entry.deviceLabel}` : ''}
                  </p>
                </div>
                <time className="shrink-0 text-[10px] tabular-nums text-text-muted">
                  {new Date(entry.createdAt).toLocaleString('fr-FR')}
                </time>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </motion.section>
  )
}
