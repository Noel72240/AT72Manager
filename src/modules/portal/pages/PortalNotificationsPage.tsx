import { Bell } from 'lucide-react'
import { portalApiService } from '@/services/portal/portal-api.service'
import { usePortalAuthStore } from '@/store/portal-auth.store'
import { usePortalDataStore } from '@/store/portal-data.store'
import { cn } from '@/utils/cn'

const KIND_LABELS: Record<string, string> = {
  intervention_updated: 'Réparation',
  quote_ready: 'Devis',
  device_ready: 'Appareil prêt',
  invoice_ready: 'Facture',
  message_received: 'Message',
  appointment_reminder: 'Rendez-vous',
}

export function PortalNotificationsPage() {
  const session = usePortalAuthStore((s) => s.session)
  const notifications = usePortalDataStore((s) => s.notifications)
  const refresh = usePortalDataStore((s) => s.refresh)

  async function markRead(id: string) {
    await portalApiService.markNotificationRead(id)
    if (session) await refresh(session.clientId)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-12 lg:p-8">
      <h1 className="text-2xl font-semibold text-text-primary">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="rounded-2xl border border-border p-8 text-center text-sm text-text-muted">
          Aucune notification.
        </p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => void markRead(n.id)}
                className={cn(
                  'flex w-full gap-4 rounded-2xl border p-4 text-left transition',
                  n.readAt
                    ? 'border-border/60 bg-surface/40 opacity-70'
                    : 'border-neon-blue/25 bg-neon-blue/5',
                )}
              >
                <Bell className="size-5 shrink-0 text-neon-blue" />
                <div>
                  <p className="text-xs font-medium uppercase text-text-muted">
                    {KIND_LABELS[n.kind] ?? n.kind}
                  </p>
                  <p className="font-medium text-text-primary">{n.title}</p>
                  <p className="text-sm text-text-secondary">{n.body}</p>
                  <p className="mt-1 text-[11px] text-text-muted">
                    {new Date(n.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
