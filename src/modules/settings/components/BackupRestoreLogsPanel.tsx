import { motion } from 'framer-motion'
import type { BackupLogEntry } from '@/services/backup/backup-logger.service'
import { cn } from '@/utils/cn'

type BackupRestoreLogsPanelProps = {
  logs: BackupLogEntry[]
  onClear?: () => void
}

const levelClass: Record<BackupLogEntry['level'], string> = {
  info: 'text-text-muted',
  warn: 'text-warning',
  error: 'text-danger',
  success: 'text-neon-green',
}

export function BackupRestoreLogsPanel({ logs, onClear }: BackupRestoreLogsPanelProps) {
  if (logs.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/80 bg-surface-elevated/60 p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-text-primary">Journal de restauration</h3>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-text-muted hover:text-text-primary"
          >
            Effacer
          </button>
        )}
      </div>
      <ol className="max-h-48 space-y-1 overflow-y-auto font-mono text-[11px]">
        {logs.map((entry, i) => (
          <li key={`${entry.at}-${entry.code}-${i}`} className={cn(levelClass[entry.level])}>
            <span className="opacity-60">{new Date(entry.at).toLocaleTimeString('fr-FR')}</span>{' '}
            <span className="font-semibold">[{entry.code}]</span> {entry.message}
            {entry.detail ? <span className="opacity-70"> — {entry.detail}</span> : null}
          </li>
        ))}
      </ol>
    </motion.section>
  )
}
