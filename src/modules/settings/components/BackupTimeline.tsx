import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Cloud,
  HardDrive,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react'
import type { BackupSnapshotRecord } from '@/services/backup/backup.types'
import { formatBytes } from '@/services/backup'
import { cn } from '@/utils/cn'

type BackupTimelineProps = {
  snapshots: BackupSnapshotRecord[]
  onRollback: (id: string) => void
  onDelete: (id: string) => void
  restoring: boolean
}

function statusBadge(status: BackupSnapshotRecord['status']) {
  const map: Record<BackupSnapshotRecord['status'], string> = {
    verified: 'bg-neon-green/10 text-neon-green ring-neon-green/20',
    in_progress: 'bg-neon-blue/10 text-neon-blue ring-neon-blue/20',
    failed: 'bg-danger/10 text-danger ring-danger/20',
    completed: 'bg-neon-green/10 text-neon-green ring-neon-green/20',
  }
  const labels: Record<BackupSnapshotRecord['status'], string> = {
    verified: 'Vérifié',
    in_progress: 'En cours',
    failed: 'Échec',
    completed: 'OK',
  }
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium ring-1', map[status])}>
      {labels[status]}
    </span>
  )
}

function sourceLabel(source: BackupSnapshotRecord['source']) {
  const map = {
    manual: 'Manuelle',
    auto: 'Automatique',
    pre_restore: 'Avant restauration',
    import: 'Import',
  }
  return map[source]
}

export function BackupTimeline({ snapshots, onRollback, onDelete, restoring }: BackupTimelineProps) {
  if (snapshots.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border border-dashed border-border/80 bg-surface/40 p-10 text-center"
      >
        <HardDrive className="mx-auto mb-3 h-10 w-10 text-text-muted" />
        <p className="text-sm text-text-muted">Aucune sauvegarde locale pour le moment.</p>
        <p className="mt-1 text-xs text-text-muted">Créez une première sauvegarde manuelle ci-dessus.</p>
      </motion.div>
    )
  }

  return (
    <ol className="relative space-y-0 border-l border-border/60 pl-6">
      {snapshots.map((snap, index) => (
        <motion.li
          key={snap.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.04 }}
          className="relative pb-8 last:pb-0"
        >
          <span
            className={cn(
              'absolute -left-[1.65rem] top-1 flex h-3 w-3 rounded-full ring-4 ring-surface-elevated',
              snap.integrityVerified ? 'bg-neon-green' : 'bg-warning',
            )}
          />
          <article className="rounded-xl border border-border/80 bg-surface-elevated/60 p-4 shadow-card glass-elevated transition hover:border-neon-blue/20">
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 + 0.05 }}
              className="flex flex-wrap items-start justify-between gap-3"
            >
              <div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.04 + 0.08 }}
                  className="flex flex-wrap items-center gap-2"
                >
                  <h4 className="font-semibold text-text-primary">{snap.label}</h4>
                  {statusBadge(snap.status)}
                  <span className="text-xs text-text-muted">{sourceLabel(snap.source)}</span>
                </motion.div>
                <p className="mt-1 text-xs text-text-muted">
                  {new Date(snap.createdAt).toLocaleString('fr-FR')} · {formatBytes(snap.sizeBytes)} ·{' '}
                  {snap.format.toUpperCase()}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-muted">
                  {snap.integrityVerified && (
                    <span className="inline-flex items-center gap-1 text-neon-green">
                      <ShieldCheck className="h-3.5 w-3.5" /> SHA-256 OK
                    </span>
                  )}
                  {snap.cloudStatus === 'pending' && (
                    <span className="inline-flex items-center gap-1 text-neon-blue">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cloud…
                    </span>
                  )}
                {snap.cloudStatus === 'uploaded' && (
                  <span className="inline-flex items-center gap-1 text-neon-blue">
                    <Cloud className="h-3.5 w-3.5" /> Cloud
                    {snap.payloadGzipBase64 ? '' : ' (rollback via cloud)'}
                  </span>
                )}
                  {snap.cloudStatus === 'failed' && (
                    <span
                      className="inline-flex items-center gap-1 text-warning"
                      title={snap.errorMessage ?? 'Échec upload cloud'}
                    >
                      <XCircle className="h-3.5 w-3.5" /> Cloud échec
                      {snap.errorMessage ? `: ${snap.errorMessage.slice(0, 80)}` : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={restoring || (!snap.payloadGzipBase64 && snap.cloudStatus !== 'uploaded')}
                  title={
                    snap.payloadGzipBase64
                      ? 'Restaurer cet état (recharge l’application)'
                      : snap.cloudStatus === 'uploaded'
                        ? 'Télécharger depuis Supabase Storage puis restaurer'
                        : 'Payload local absent — importez le fichier .json/.zip exporté'
                  }
                  onClick={() => onRollback(snap.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary transition hover:border-neon-blue/40 hover:bg-primary-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {restoring ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  Rollback
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(snap.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted transition hover:border-danger/40 hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
            {!snap.payloadGzipBase64 && snap.cloudStatus !== 'uploaded' && (
              <p className="mt-2 text-xs text-warning">
                Rollback indisponible : données compressées non conservées localement. Réimportez
                l’export JSON/ZIP de cette sauvegarde.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(snap.entityCounts).map(([key, count]) =>
                count ? (
                  <span
                    key={key}
                    className="rounded-md bg-surface px-2 py-0.5 text-[11px] text-text-muted"
                  >
                    {key}: {count}
                  </span>
                ) : null,
              )}
            </div>
          </article>
        </motion.li>
      ))}
    </ol>
  )
}

export function BackupIntegrityBanner({ verified }: { verified: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm',
        verified
          ? 'border-neon-green/30 bg-neon-green/5 text-neon-green'
          : 'border-warning/30 bg-warning/5 text-warning',
      )}
    >
      {verified ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <ShieldCheck className="h-5 w-5 shrink-0" />}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="font-medium">Protection intégrité active</p>
        <p className="text-xs opacity-80">
          Chaque sauvegarde est signée SHA-256. Rollback sécurisé via snapshot pré-restauration.
        </p>
      </motion.div>
    </motion.div>
  )
}
