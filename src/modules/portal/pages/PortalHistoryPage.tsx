import { History } from 'lucide-react'
import { usePortalDataStore } from '@/store/portal-data.store'
import { STATUS_LABELS } from '@/modules/interventions/utils/intervention-labels'

export function PortalHistoryPage() {
  const interventions = usePortalDataStore((s) => s.interventions)
  const history = interventions
    .filter((i) => ['completed', 'returned'].includes(i.status))
    .sort((a, b) => (a.completedAt ?? a.updatedAt) < (b.completedAt ?? b.updatedAt) ? 1 : -1)

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-12 lg:p-8">
      <h1 className="text-2xl font-semibold text-text-primary">Historique SAV</h1>
      <p className="text-sm text-text-secondary">Vos réparations terminées et dossiers archivés.</p>

      {history.length === 0 ? (
        <p className="rounded-2xl border border-border p-8 text-center text-sm text-text-muted">
          Aucun historique pour le moment.
        </p>
      ) : (
        <ul className="space-y-3">
          {history.map((item) => (
            <li
              key={item.id}
              className="flex gap-4 rounded-2xl border border-border bg-surface-elevated/60 p-4"
            >
              <History className="size-5 shrink-0 text-text-muted" />
              <div>
                <p className="font-medium text-text-primary">
                  {item.deviceLabel || item.reportedIssue}
                </p>
                <p className="text-xs text-text-muted">{STATUS_LABELS[item.status]}</p>
                <p className="mt-1 text-[11px] text-text-muted">
                  {item.completedAt
                    ? new Date(item.completedAt).toLocaleDateString('fr-FR')
                    : new Date(item.updatedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
