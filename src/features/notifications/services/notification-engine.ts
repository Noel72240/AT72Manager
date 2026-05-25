import type { Intervention, Invoice, Quote, SparePart } from '@/types/entities'
import { getStockLevel } from '@/modules/inventory/utils/stock-level'
import { ROUTES } from '@/config/routes'
import { syncQueue } from '@/services/sync/sync-queue'
import { syncService } from '@/services/sync/sync.service'
import { emitFeedItem } from '@/features/notifications/services/feed.service'

const ACTIVE_STATUSES = ['diagnostic', 'in_progress', 'waiting_parts'] as const
const URGENT_DAYS = 7

function isInvoiceUnpaid(invoice: Invoice): boolean {
  if (invoice.status === 'paid' || invoice.status === 'rejected' || invoice.status === 'draft') {
    return false
  }
  if (!invoice.dueDate) return invoice.status === 'sent' || invoice.status === 'accepted'
  return new Date(invoice.dueDate).getTime() < Date.now()
}

export async function runNotificationEngine(userId: string): Promise<void> {
  const [parts, interventions, quotes, invoices, failedCount, pendingCount, lastSync] =
    await Promise.all([
      import('@/services/database/repositories/spare-parts.repository').then((m) =>
        m.sparePartsRepository.list(),
      ),
      import('@/services/database/repositories/interventions.repository').then((m) =>
        m.interventionsRepository.list(),
      ),
      import('@/services/database/repositories/quotes.repository').then((m) =>
        m.quotesRepository.list(),
      ),
      import('@/services/database/repositories/invoices.repository').then((m) =>
        m.invoicesRepository.list(),
      ),
      syncQueue.getFailedCount(),
      syncQueue.getPendingCount(),
      syncService.getLastSyncAt(),
    ])

  await scanStock(userId, parts)
  await scanInterventions(userId, interventions)
  await scanScheduledInterventions(userId, interventions)
  await scanQuotes(userId, quotes)
  await scanInvoices(userId, invoices)
  await scanSync(userId, failedCount, pendingCount, lastSync)
}

async function scanStock(userId: string, parts: SparePart[]) {
  for (const part of parts) {
    const level = getStockLevel(part)
    if (level === 'out') {
      await emitFeedItem(
        userId,
        {
          kind: 'stock_out',
          title: `Rupture — ${part.name}`,
          message: `Réf. ${part.reference} — réapprovisionnement urgent`,
          href: ROUTES.STOCK,
          entityType: 'spare_part',
          entityId: part.id,
          dedupeKey: `stock_out:${part.id}`,
        },
        { dedupe: true },
      )
    } else if (level === 'low') {
      await emitFeedItem(
        userId,
        {
          kind: 'stock_low',
          title: `Stock faible — ${part.name}`,
          message: `${part.quantity} restant(s), seuil ${part.minThreshold}`,
          href: ROUTES.PARTS,
          entityType: 'spare_part',
          entityId: part.id,
          dedupeKey: `stock_low:${part.id}`,
        },
        { dedupe: true },
      )
    }
  }
}

async function scanInterventions(userId: string, interventions: Intervention[]) {
  const urgentThreshold = Date.now() - URGENT_DAYS * 24 * 60 * 60 * 1000

  for (const item of interventions) {
    if (
      ACTIVE_STATUSES.includes(item.status as (typeof ACTIVE_STATUSES)[number]) &&
      new Date(item.createdAt).getTime() < urgentThreshold
    ) {
      await emitFeedItem(
        userId,
        {
          kind: 'intervention_urgent',
          title: 'Intervention urgente',
          message: item.reportedIssue.slice(0, 80),
          href: ROUTES.INTERVENTIONS,
          entityType: 'intervention',
          entityId: item.id,
          dedupeKey: `intervention_urgent:${item.id}`,
        },
        { dedupe: true },
      )
    }
  }
}

async function scanScheduledInterventions(userId: string, interventions: Intervention[]) {
  const now = Date.now()
  const in24h = now + 24 * 60 * 60 * 1000

  for (const item of interventions) {
    if (!item.scheduledAt) continue
    if (item.status === 'completed' || item.status === 'returned') continue

    const scheduledMs = new Date(item.scheduledAt).getTime()
    if (Number.isNaN(scheduledMs)) continue

    if (scheduledMs < now - 30 * 60_000) {
      await emitFeedItem(
        userId,
        {
          kind: 'intervention_urgent',
          title: 'Rendez-vous en retard',
          message: `${item.reportedIssue.slice(0, 60)} · ${new Date(item.scheduledAt).toLocaleString('fr-FR')}`,
          href: ROUTES.CALENDAR,
          entityType: 'intervention',
          entityId: item.id,
          dedupeKey: `intervention_overdue:${item.id}:${item.scheduledAt.slice(0, 13)}`,
        },
        { dedupe: true },
      )
    } else if (scheduledMs >= now && scheduledMs <= in24h) {
      await emitFeedItem(
        userId,
        {
          kind: 'intervention_due_soon',
          title: 'Rappel rendez-vous',
          message: `${item.reportedIssue.slice(0, 60)} · ${new Date(item.scheduledAt).toLocaleString('fr-FR')}`,
          href: ROUTES.CALENDAR,
          entityType: 'intervention',
          entityId: item.id,
          dedupeKey: `intervention_due_soon:${item.id}:${item.scheduledAt.slice(0, 13)}`,
        },
        { dedupe: true, toast: false },
      )
    }
  }
}

async function scanQuotes(userId: string, quotes: Quote[]) {
  for (const quote of quotes.filter((q) => q.status === 'accepted')) {
    await emitFeedItem(
      userId,
      {
        kind: 'quote_accepted',
        title: `Devis accepté ${quote.number}`,
        message: quote.title ?? 'Prêt pour facturation',
        href: ROUTES.QUOTES,
        entityType: 'quote',
        entityId: quote.id,
        dedupeKey: `quote_accepted:${quote.id}`,
      },
      { dedupe: true },
    )
  }
}

async function scanInvoices(userId: string, invoices: Invoice[]) {
  for (const invoice of invoices.filter(isInvoiceUnpaid)) {
    await emitFeedItem(
      userId,
      {
        kind: 'invoice_unpaid',
        title: `Facture impayée ${invoice.number}`,
        message: invoice.dueDate
          ? `Échéance dépassée (${new Date(invoice.dueDate).toLocaleDateString('fr-FR')})`
          : 'En attente de règlement',
        href: ROUTES.INVOICES,
        entityType: 'invoice',
        entityId: invoice.id,
        dedupeKey: `invoice_unpaid:${invoice.id}`,
      },
      { dedupe: true },
    )
  }
}

async function scanSync(
  userId: string,
  failedCount: number,
  pendingCount: number,
  lastSync: string | null,
) {
  if (failedCount > 0) {
    const summary = await syncService.getFailureSummary()
    await emitFeedItem(
      userId,
      {
        kind: 'sync_error',
        title: 'Erreurs de synchronisation',
        message:
          summary.hint ??
          `${failedCount} élément(s) en échec — cliquez « Synchroniser » sur le tableau de bord`,
        href: ROUTES.DASHBOARD,
        dedupeKey: `sync_error:${failedCount}:${summary.hint?.slice(0, 48) ?? 'generic'}`,
      },
      { dedupe: true },
    )
  }

  if (lastSync && pendingCount === 0 && failedCount === 0) {
    const syncDay = lastSync.slice(0, 10)
    await emitFeedItem(
      userId,
      {
        kind: 'sync_success',
        title: 'Sauvegarde cloud réussie',
        message: `Dernière sync : ${new Date(lastSync).toLocaleString('fr-FR')}`,
        dedupeKey: `sync_success:${syncDay}`,
      },
      { dedupe: true, toast: false },
    )
  }
}
