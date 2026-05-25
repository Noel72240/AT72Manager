import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList } from 'lucide-react'
import { auditService } from '@/services/audit/audit.service'
import { useAuthStore } from '@/store/auth.store'
import type { AuditLogEntry } from '@/types/audit.types'
import { fadeInUp } from '@/utils/motion'

const ACTION_LABELS: Record<string, string> = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
  login: 'Connexion',
  logout: 'Déconnexion',
  restore: 'Restauration',
  export: 'Export',
  import: 'Import',
}

export function AuditTrailPanel() {
  const workshopId = useAuthStore((state) => state.user?.workshopId)
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workshopId) return
    setLoading(true)
    void auditService.list(workshopId, 50).then((data) => {
      setEntries(data)
      setLoading(false)
    })
  }, [workshopId])

  return (
    <motion.section variants={fadeInUp} className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary-muted ring-1 ring-neon-blue/25">
          <ClipboardList className="size-5 text-neon-blue" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Audit trail</h2>
          <p className="text-sm text-text-muted">Historique professionnel des actions atelier.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-surface-elevated/60">
        {loading ? (
          <p className="px-4 py-8 text-sm text-text-muted">Chargement…</p>
        ) : entries.length === 0 ? (
          <p className="px-4 py-8 text-sm text-text-muted">Aucune entrée d&apos;audit.</p>
        ) : (
          <ul className="max-h-[420px] divide-y divide-border/50 overflow-y-auto">
            {entries.map((entry, index) => (
              <motion.li
                key={entry.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{entry.summary}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {entry.actorName} · {ACTION_LABELS[entry.action] ?? entry.action} ·{' '}
                      {entry.resource}
                    </p>
                  </div>
                  <time className="text-[10px] tabular-nums text-text-muted">
                    {new Date(entry.createdAt).toLocaleString('fr-FR')}
                  </time>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </motion.section>
  )
}
