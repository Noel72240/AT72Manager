import { motion } from 'framer-motion'
import { Cloud, Loader2, RefreshCw, RotateCcw } from 'lucide-react'
import type { CloudBackupFile } from '@/services/backup/backup.types'
import { formatBytes } from '@/services/backup'
import { cn } from '@/utils/cn'

type BackupCloudPanelProps = {
  files: CloudBackupFile[]
  loading: boolean
  restoring: boolean
  cloudEnabled: boolean
  onRefresh: () => void
  onRestore: (path: string) => void
  lastError?: string | null
}

export function BackupCloudPanel({
  files,
  loading,
  restoring,
  cloudEnabled,
  onRefresh,
  onRestore,
  lastError,
}: BackupCloudPanelProps) {
  if (!cloudEnabled) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-neon-blue/20 bg-neon-blue/5 p-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <Cloud className="h-5 w-5 text-neon-blue" />
          <h3 className="text-sm font-semibold text-text-primary">Sauvegardes Supabase Storage</h3>
        </motion.div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-text-muted transition hover:border-neon-blue/40 hover:text-text-primary disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Actualiser
        </button>
      </div>

      <p className="mb-3 text-xs text-text-muted">
        Fichiers dans le bucket <code className="text-neon-blue">backups</code>. Seuls les exports{' '}
        <strong>Archive ZIP</strong> / <strong>JSON</strong> et la sauvegarde auto sont envoyés ici
        (pas les snapshots « Avant restauration »).
      </p>

      {lastError && (
        <p className="mb-3 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
          {lastError}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-text-muted">Chargement des fichiers cloud…</p>
      ) : files.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/80 bg-surface/40 px-4 py-6 text-center">
          <p className="text-sm text-text-muted">Aucun fichier cloud trouvé.</p>
          <p className="mt-1 text-xs text-text-muted">
            Cliquez <strong>Archive ZIP</strong> pour créer une sauvegarde cloud, ou vérifiez que le
            bucket <code>backups</code> existe dans Supabase.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <motion.li
              key={file.path}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={cn(
                'flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-surface-elevated/80 px-3 py-2.5',
              )}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 + 0.04 }}
              >
                <p className="text-sm font-medium text-text-primary">{file.name}</p>
                <p className="text-xs text-text-muted">
                  {new Date(file.createdAt).toLocaleString('fr-FR')} · {formatBytes(file.sizeBytes)}
                </p>
              </motion.div>
              <button
                type="button"
                disabled={restoring}
                onClick={() => onRestore(file.path)}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:border-neon-blue/40 hover:bg-primary-muted disabled:opacity-50"
              >
                {restoring ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                Restaurer
              </button>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.section>
  )
}
