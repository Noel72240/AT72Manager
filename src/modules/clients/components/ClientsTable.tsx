import { FileText, Mail, MapPin, Pencil, Phone, Trash2, UserRound } from 'lucide-react'
import type { ClientTableRow } from '@/modules/clients/types/client-module.types'
import { ClientStatusBadge } from '@/modules/clients/components/ClientStatusBadge'
import { Button } from '@/components/ui/Button'

type ClientsTableProps = {
  rows: ClientTableRow[]
  onEdit: (client: ClientTableRow) => void
  onDelete: (client: ClientTableRow) => void
  onCreateQuote?: (client: ClientTableRow) => void
  deletingId?: string | null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function ClientsTable({
  rows,
  onEdit,
  onDelete,
  onCreateQuote,
  deletingId,
}: ClientsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/80 text-xs uppercase tracking-wide text-text-muted">
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Statut</th>
            <th className="px-4 py-3 font-medium">Créé le</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((client) => (
            <tr
              key={client.id}
              className="border-b border-border/50 transition-colors hover:bg-surface-hover/40"
            >
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-muted ring-1 ring-neon-blue/20">
                    <UserRound className="size-4 text-neon-blue" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary">{client.fullName}</p>
                    {client.address ? (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-muted">
                        <MapPin className="size-3 shrink-0" />
                        {client.address}
                      </p>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <div className="space-y-1 text-text-secondary">
                  {client.phone ? (
                    <p className="flex items-center gap-1.5">
                      <Phone className="size-3.5 shrink-0 text-text-muted" />
                      {client.phone}
                    </p>
                  ) : null}
                  {client.email ? (
                    <p className="flex items-center gap-1.5">
                      <Mail className="size-3.5 shrink-0 text-text-muted" />
                      {client.email}
                    </p>
                  ) : null}
                  {!client.phone && !client.email ? (
                    <span className="text-xs text-text-muted">—</span>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-3.5">
                <ClientStatusBadge status={client.status} />
              </td>
              <td className="px-4 py-3.5 text-text-secondary">{formatDate(client.createdAt)}</td>
              <td className="px-4 py-3.5">
                <div className="flex items-center justify-end gap-1">
                  {onCreateQuote ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Devis pour ${client.fullName}`}
                      title="Créer un devis"
                      onClick={() => onCreateQuote(client)}
                    >
                      <FileText className="size-4 text-neon-blue" />
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Modifier ${client.fullName}`}
                    onClick={() => onEdit(client)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Supprimer ${client.fullName}`}
                    onClick={() => onDelete(client)}
                    loading={deletingId === client.id}
                    className="text-danger hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
