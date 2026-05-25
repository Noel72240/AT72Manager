import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CloudOff,
  Loader2,
  RefreshCw,
  Smartphone,
  Unplug,
  WifiOff,
} from 'lucide-react'
import { env } from '@/config/env'
import { googleCalendarAuthService } from '@/services/calendar/google/google-calendar-auth.service'
import { useGoogleCalendarStore } from '@/store/google-calendar.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'
import { fadeInUp } from '@/utils/motion'

const SYNC_INTERVAL_OPTIONS = [
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 h' },
]

const FUTURE_INTEGRATIONS = [
  { name: 'Outlook Calendar', icon: Calendar, eta: 'Q3 2026' },
  { name: 'Apple Calendar', icon: Calendar, eta: 'Q3 2026' },
  { name: 'Notifications push mobile', icon: Smartphone, eta: 'App technicien' },
]

export function GoogleCalendarSettingsPanel() {
  const {
    settings,
    status,
    connected,
    configured,
    calendars,
    conflicts,
    queueSize,
    syncing,
    connecting,
    lastResult,
    load,
    connect,
    disconnect,
    refreshCalendars,
    updateSettings,
    syncNow,
    resolveConflict,
  } = useGoogleCalendarStore()

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (connected) void refreshCalendars()
  }, [connected, refreshCalendars])

  const statusBadge = (() => {
    if (connecting) {
      return { label: 'Connexion…', variant: 'primary' as const, icon: Loader2 }
    }
    if (syncing) {
      return { label: 'Synchronisation…', variant: 'primary' as const, icon: Loader2 }
    }
    switch (status) {
      case 'connected':
        return { label: 'Connecté', variant: 'success' as const, icon: CheckCircle2 }
      case 'syncing':
        return { label: 'Synchronisation…', variant: 'primary' as const, icon: Loader2 }
      case 'offline':
        return { label: 'Hors ligne', variant: 'default' as const, icon: WifiOff }
      case 'error':
        return { label: 'Erreur', variant: 'danger' as const, icon: AlertTriangle }
      default:
        return { label: 'Non connecté', variant: 'default' as const, icon: Unplug }
    }
  })()

  const StatusIcon = statusBadge.icon

  return (
    <motion.div variants={fadeInUp} className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="relative border-b border-border/60 bg-gradient-to-br from-primary-muted/30 via-surface-elevated to-surface-elevated px-6 py-5">
          <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-neon-blue/10 blur-3xl" />
          <motion.div
            className="relative flex flex-wrap items-start justify-between gap-4"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            <motion.div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-white/5 ring-1 ring-neon-blue/30">
                <Calendar className="size-6 text-neon-blue" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-neon-blue">
                  Intégrations calendrier
                </p>
                <h2 className="text-lg font-semibold text-text-primary">Google Calendar</h2>
                <p className="mt-1 max-w-xl text-sm text-text-muted">
                  Synchronisez vos rendez-vous AT72 avec Google Calendar — notifications natives,
                  accès mobile et agenda personnel.
                </p>
              </div>
            </motion.div>

            <Badge variant={statusBadge.variant} className="flex items-center gap-1.5 px-3 py-1">
              <StatusIcon className={cn('size-3.5', (status === 'syncing' || connecting || syncing) && 'animate-spin')} />
              {statusBadge.label}
            </Badge>
          </motion.div>
        </div>

        <div className="space-y-6 p-6">
          {!configured ? (
            <motion.div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
              Ajoutez <code className="rounded bg-black/20 px-1">VITE_GOOGLE_CLIENT_ID</code> dans
              votre fichier <code className="rounded bg-black/20 px-1">.env</code> (Console Google
              Cloud → OAuth 2.0).
            </motion.div>
          ) : (
            <motion.div className="rounded-xl border border-border/60 bg-surface-hover/20 px-4 py-3 text-xs text-text-muted">
              {googleCalendarAuthService.isDesktopApp()
                ? 'App desktop : la connexion s’ouvre dans votre navigateur (Chrome/Edge). Utilisez un client OAuth Google de type « Application de bureau ».'
                : 'Navigateur web : autorisez les popups Google ou utilisez l’app desktop (npm run dev:tauri).'}
            </motion.div>
          )}

          <div className="flex flex-wrap gap-3">
            {!connected ? (
              <Button
                onClick={() => void connect()}
                disabled={!configured || syncing || connecting}
              >
                {connecting ? 'Connexion…' : 'Connecter Google'}
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() => void syncNow()}
                  disabled={syncing || !settings.enabled}
                >
                  {syncing ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 size-4" />
                  )}
                  Synchroniser maintenant
                </Button>
                <Button variant="ghost" onClick={() => void disconnect()}>
                  Déconnecter
                </Button>
              </>
            )}
          </div>

          {settings.lastSyncError ? (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              <strong>Dernière erreur :</strong> {settings.lastSyncError}
            </div>
          ) : null}

          {lastResult ? <p className="text-xs text-text-muted">Dernière sync : {lastResult}</p> : null}

          {queueSize > 0 ? (
            <motion.div className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface-hover/20 px-3 py-2 text-xs text-text-secondary">
              <CloudOff className="size-4 text-warning" />
              {queueSize} opération(s) en attente (mode offline — resync automatique au retour en
              ligne)
            </motion.div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-text-primary">Sync automatique</p>
                <p className="text-xs text-text-muted">AT72 ↔ Google en arrière-plan</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSync}
                onChange={(e) => void updateSettings({ autoSync: e.target.checked })}
                disabled={!connected}
                className="size-4 accent-neon-blue"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-text-primary">Sync bidirectionnelle</p>
                <p className="text-xs text-text-muted">Modifications Google → AT72</p>
              </div>
              <input
                type="checkbox"
                checked={settings.bidirectional}
                onChange={(e) => void updateSettings({ bidirectional: e.target.checked })}
                disabled={!connected}
                className="size-4 accent-neon-blue"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-text-primary">Activer la sync</p>
                <p className="text-xs text-text-muted">Créer / modifier / supprimer sur Google</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => void updateSettings({ enabled: e.target.checked })}
                disabled={!connected}
                className="size-4 accent-neon-blue"
              />
            </label>

            <label className="rounded-xl border border-border/60 px-4 py-3">
              <p className="text-sm font-medium text-text-primary">Fréquence sync</p>
              <select
                value={settings.syncIntervalMinutes}
                onChange={(e) =>
                  void updateSettings({ syncIntervalMinutes: Number(e.target.value) })
                }
                disabled={!connected || !settings.autoSync}
                className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
              >
                {SYNC_INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-xl border border-border/60 px-4 py-3 md:col-span-2">
              <p className="text-sm font-medium text-text-primary">Calendrier cible</p>
              <select
                value={settings.targetCalendarId}
                onChange={(e) => {
                  const cal = calendars.find((c) => c.id === e.target.value)
                  void updateSettings({
                    targetCalendarId: e.target.value,
                    targetCalendarName: cal?.summary ?? e.target.value,
                  })
                }}
                disabled={!connected}
                className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
              >
                {calendars.length === 0 ? (
                  <option value={settings.targetCalendarId}>
                    {settings.targetCalendarName || settings.targetCalendarId}
                  </option>
                ) : (
                  calendars.map((cal) => (
                    <option key={cal.id} value={cal.id}>
                      {cal.summary}
                      {cal.primary ? ' (principal)' : ''}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="rounded-xl border border-border/60 px-4 py-3 md:col-span-2">
              <p className="text-sm font-medium text-text-primary">
                Rappel Google (minutes avant)
              </p>
              <p className="text-xs text-text-muted">
                Notifications popup + e-mail natives Google Calendar
              </p>
              <input
                type="number"
                min={5}
                max={1440}
                step={5}
                value={settings.defaultReminderMinutes}
                onChange={(e) =>
                  void updateSettings({ defaultReminderMinutes: Number(e.target.value) })
                }
                disabled={!connected}
                className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
              />
            </label>
          </div>

          {settings.lastSyncAt ? (
            <p className="text-xs text-text-muted">
              Dernière synchronisation : {new Date(settings.lastSyncAt).toLocaleString('fr-FR')}
            </p>
          ) : null}
        </div>
      </Card>

      {conflicts.length > 0 ? (
        <Card className="border-warning/30 p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="size-5 text-warning" />
            <h3 className="text-sm font-semibold text-text-primary">
              Conflits calendrier ({conflicts.length})
            </h3>
          </div>
          <ul className="space-y-3">
            {conflicts.map((link) => (
              <li
                key={link.interventionId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-surface-hover/20 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Intervention {link.interventionId.slice(0, 8)}…
                  </p>
                  <p className="text-xs text-text-muted">
                    Modifié simultanément sur AT72 et Google
                  </p>
                </div>
                <motion.div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void resolveConflict(link.interventionId, 'keep_at72')}
                  >
                    Garder AT72
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void resolveConflict(link.interventionId, 'keep_google')}
                  >
                    Garder Google
                  </Button>
                </motion.div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="p-5">
        <h3 className="mb-1 text-sm font-semibold text-text-primary">Prochaines intégrations</h3>
        <p className="mb-4 text-xs text-text-muted">
          Architecture préparée pour étendre la sync calendrier multi-plateforme.
        </p>
        <ul className="grid gap-3 sm:grid-cols-3">
          {FUTURE_INTEGRATIONS.map((item) => (
            <li
              key={item.name}
              className="rounded-xl border border-dashed border-border/60 bg-surface-hover/10 px-4 py-3"
            >
              <item.icon className="mb-2 size-4 text-text-muted" />
              <p className="text-sm font-medium text-text-secondary">{item.name}</p>
              <p className="text-[10px] text-text-muted">{item.eta}</p>
            </li>
          ))}
        </ul>
      </Card>

      {env.isGoogleCalendarConfigured ? (
        <p className="text-[10px] text-text-muted">
          Client ID configuré · OAuth Google Identity Services · scopes calendar.events + readonly
        </p>
      ) : null}
    </motion.div>
  )
}
