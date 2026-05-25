import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Settings, Unplug, WifiOff } from 'lucide-react'
import { useEffect } from 'react'
import { useGoogleCalendarStore } from '@/store/google-calendar.store'
import { ROUTES } from '@/config/routes'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export function GoogleCalendarSyncBanner() {
  const {
    settings,
    status,
    connected,
    configured,
    conflicts,
    queueSize,
    syncing,
    connecting,
    load,
    syncNow,
  } = useGoogleCalendarStore()

  useEffect(() => {
    void load()
  }, [load])

  if (!configured) return null

  const showBanner = connected || queueSize > 0 || conflicts.length > 0 || settings.enabled

  if (!showBanner && status === 'disconnected') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border/60 bg-surface-hover/10 px-4 py-3">
        <p className="text-sm text-text-muted">
          Connectez Google Calendar pour synchroniser vos rendez-vous sur mobile.
        </p>
        <Link
          to={`${ROUTES.SETTINGS}?tab=integrations`}
          className="text-sm font-medium text-neon-blue hover:underline"
        >
          Configurer →
        </Link>
      </div>
    )
  }

  const isBusy = syncing || connecting || status === 'syncing'

  const StatusIcon =
    isBusy
      ? Loader2
      : status === 'connected'
        ? CheckCircle2
        : status === 'offline'
          ? WifiOff
          : status === 'error'
            ? AlertTriangle
            : Unplug

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3',
        status === 'error'
          ? 'border-danger/30 bg-danger/10'
          : conflicts.length > 0
            ? 'border-warning/30 bg-warning/10'
            : 'border-neon-blue/20 bg-primary-muted/15',
      )}
    >
      <div className="flex items-center gap-3">
        <StatusIcon
          className={cn(
            'size-4 shrink-0',
            isBusy && 'animate-spin text-neon-blue',
            status === 'connected' && 'text-neon-green',
            status === 'error' && 'text-danger',
            status === 'offline' && 'text-text-muted',
          )}
        />
        <div>
          <p className="text-sm font-medium text-text-primary">
            Google Calendar
            {settings.enabled && connected ? ' · sync active' : connected ? ' · connecté' : ''}
          </p>
          <p className="text-xs text-text-muted">
            {status === 'offline'
              ? `${queueSize} opération(s) en file d'attente offline`
              : conflicts.length > 0
                ? `${conflicts.length} conflit(s) à résoudre`
                : settings.lastSyncAt
                  ? `Dernière sync ${new Date(settings.lastSyncAt).toLocaleString('fr-FR')}`
                  : 'Prêt à synchroniser'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {settings.enabled && connected ? (
          <Button size="sm" variant="secondary" disabled={syncing} onClick={() => void syncNow()}>
            {syncing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Sync
          </Button>
        ) : null}
        <Link to={`${ROUTES.SETTINGS}?tab=integrations`}>
          <Button size="sm" variant="ghost">
            <Settings className="size-3.5" />
            Paramètres
          </Button>
        </Link>
      </div>
    </div>
  )
}
