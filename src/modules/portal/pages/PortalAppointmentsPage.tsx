import { Calendar } from 'lucide-react'
import { usePortalDataStore } from '@/store/portal-data.store'
import { STATUS_LABELS } from '@/modules/interventions/utils/intervention-labels'

export function PortalAppointmentsPage() {
  const interventions = usePortalDataStore((s) => s.interventions)
  const scheduled = interventions
    .filter((i) => i.scheduledAt)
    .sort((a, b) => (a.scheduledAt! > b.scheduledAt! ? 1 : -1))

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-12 lg:p-8">
      <h1 className="text-2xl font-semibold text-text-primary">Mes rendez-vous</h1>
      <p className="text-sm text-text-secondary">Planning de vos passages atelier.</p>

      {scheduled.length === 0 ? (
        <p className="rounded-2xl border border-border p-8 text-center text-sm text-text-muted">
          Aucun rendez-vous planifié.
        </p>
      ) : (
        <ul className="space-y-3">
          {scheduled.map((item) => (
            <li
              key={item.id}
              className="flex gap-4 rounded-2xl border border-border bg-surface-elevated p-4"
            >
              <div className="rounded-xl bg-neon-green/10 p-3 text-neon-green">
                <Calendar className="size-5" />
              </div>
              <div>
                <p className="font-medium text-text-primary">
                  {new Date(item.scheduledAt!).toLocaleString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-sm text-text-secondary">
                  {item.deviceLabel || item.reportedIssue}
                </p>
                <p className="mt-1 text-xs text-text-muted">{STATUS_LABELS[item.status]}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
