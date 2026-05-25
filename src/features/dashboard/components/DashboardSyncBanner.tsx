import { motion } from 'framer-motion'
import { Cloud, CloudOff, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSyncStore } from '@/store/sync.store'
import { cn } from '@/utils/cn'
import { fadeInUp } from '@/utils/motion'

function formatLastSync(iso: string | null): string {
  if (!iso) return 'Jamais synchronisé'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DashboardSyncBanner() {
  const {
    isOnline,
    mode,
    pendingCount,
    failedCount,
    deadLetterCount,
    syncErrorHint,
    lastSyncAt,
    isSyncing,
    sync,
    clearFailed,
  } = useSyncStore()

  const isOffline = mode === 'offline' || !isOnline
  const backlog = pendingCount + failedCount + deadLetterCount
  const isDegraded = mode === 'degraded' && backlog > 0
  const hasFailures = failedCount > 0 || deadLetterCount > 0

  return (
    <motion.div
      variants={fadeInUp}
      className={cn(
        'flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        isOffline
          ? 'border-warning/30 bg-warning/10'
          : hasFailures
            ? 'border-warning/30 bg-warning/10'
            : isDegraded
            ? 'border-neon-blue/30 bg-primary-muted/40'
            : 'border-neon-green/20 bg-accent-muted/30',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg ring-1',
            isOffline
              ? 'bg-warning/10 text-warning ring-warning/20'
              : isDegraded
                ? 'bg-primary-muted text-neon-blue ring-neon-blue/20'
                : 'bg-accent-muted text-neon-green ring-neon-green/20',
          )}
        >
          {isOffline ? (
            <WifiOff className="size-5" />
          ) : isDegraded ? (
            <Cloud className="size-5" />
          ) : (
            <Wifi className="size-5" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">
            {isOffline
              ? 'Mode hors ligne'
              : hasFailures
                ? 'Erreurs de synchronisation'
                : isDegraded
                  ? 'Synchronisation en attente'
                  : 'Connecté · Données à jour'}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            Dernière sync : {formatLastSync(lastSyncAt)}
            {pendingCount > 0 ? ` · ${pendingCount} en attente` : ''}
            {failedCount > 0 ? ` · ${failedCount} en échec` : ''}
            {deadLetterCount > 0 ? ` · ${deadLetterCount} dead-letter` : ''}
          </p>
          {syncErrorHint ? (
            <p className="mt-1 max-w-xl text-[11px] leading-snug text-warning">{syncErrorHint}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {hasFailures ? (
          <Button variant="ghost" size="sm" onClick={() => void clearFailed()}>
            Purger échecs
          </Button>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          leftIcon={
            isSyncing ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : isOffline ? (
              <CloudOff className="size-4" />
            ) : (
              <RefreshCw className="size-4" />
            )
          }
          disabled={isOffline || isSyncing}
          onClick={() => void sync()}
        >
          {isSyncing ? 'Synchronisation…' : 'Synchroniser'}
        </Button>
      </div>
    </motion.div>
  )
}
