import type { FeedItemKind, FeedSeverity } from '@/types/entities'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Cpu,
  FileText,
  Package,
  Receipt,
  RefreshCw,
  UserPlus,
  CalendarClock,
  HardDrive,
  type LucideIcon,
} from 'lucide-react'
import { ROUTES } from '@/config/routes'

export const FEED_KIND_LABELS: Record<FeedItemKind, string> = {
  stock_low: 'Stock faible',
  stock_out: 'Rupture stock',
  intervention_urgent: 'Intervention urgente',
  intervention_scheduled: 'Rendez-vous planifié',
  intervention_due_soon: 'Rappel rendez-vous',
  intervention_completed: 'Intervention terminée',
  quote_accepted: 'Devis accepté',
  invoice_unpaid: 'Facture impayée',
  sync_error: 'Erreur synchronisation',
  sync_success: 'Sauvegarde réussie',
  client_created: 'Nouveau client',
  intervention_created: 'Nouvelle intervention',
  intervention_updated: 'Intervention modifiée',
  part_added: 'Pièce ajoutée',
  pdf_generated: 'PDF généré',
  device_created: 'Appareil enregistré',
  backup_success: 'Sauvegarde créée',
  backup_failed: 'Échec sauvegarde',
  backup_restored: 'Restauration effectuée',
}

export const FEED_KIND_ICONS: Record<FeedItemKind, LucideIcon> = {
  stock_low: Package,
  stock_out: AlertTriangle,
  intervention_urgent: AlertCircle,
  intervention_scheduled: CalendarClock,
  intervention_due_soon: CalendarClock,
  intervention_completed: CheckCircle2,
  quote_accepted: FileText,
  invoice_unpaid: Receipt,
  sync_error: AlertCircle,
  sync_success: RefreshCw,
  client_created: UserPlus,
  intervention_created: ClipboardList,
  intervention_updated: ClipboardList,
  part_added: Package,
  pdf_generated: FileText,
  device_created: Cpu,
  backup_success: HardDrive,
  backup_failed: AlertCircle,
  backup_restored: RefreshCw,
}

export const DEFAULT_FEED_SEVERITY: Record<FeedItemKind, FeedSeverity> = {
  stock_low: 'warning',
  stock_out: 'danger',
  intervention_urgent: 'danger',
  intervention_scheduled: 'success',
  intervention_due_soon: 'warning',
  intervention_completed: 'success',
  quote_accepted: 'success',
  invoice_unpaid: 'warning',
  sync_error: 'danger',
  sync_success: 'success',
  client_created: 'info',
  intervention_created: 'info',
  intervention_updated: 'info',
  part_added: 'info',
  pdf_generated: 'info',
  device_created: 'info',
  backup_success: 'success',
  backup_failed: 'danger',
  backup_restored: 'success',
}

export const FEED_KIND_ROUTES: Partial<Record<FeedItemKind, string>> = {
  stock_low: ROUTES.PARTS,
  stock_out: ROUTES.STOCK,
  intervention_urgent: ROUTES.INTERVENTIONS,
  intervention_scheduled: ROUTES.CALENDAR,
  intervention_due_soon: ROUTES.CALENDAR,
  intervention_completed: ROUTES.INTERVENTIONS,
  quote_accepted: ROUTES.QUOTES,
  invoice_unpaid: ROUTES.INVOICES,
  backup_success: ROUTES.SETTINGS,
  backup_failed: ROUTES.SETTINGS,
  backup_restored: ROUTES.SETTINGS,
}

export const SEVERITY_STYLES: Record<FeedSeverity, string> = {
  info: 'text-neon-blue bg-primary-muted ring-neon-blue/20',
  success: 'text-neon-green bg-accent-muted ring-neon-green/20',
  warning: 'text-warning bg-warning/10 ring-warning/20',
  danger: 'text-danger bg-danger/10 ring-danger/20',
}

const FALLBACK_ICON = AlertCircle

export function getFeedKindIcon(kind: FeedItemKind | string): LucideIcon {
  return FEED_KIND_ICONS[kind as FeedItemKind] ?? FALLBACK_ICON
}

export function getFeedSeverityStyle(severity: FeedSeverity | string): string {
  return SEVERITY_STYLES[severity as FeedSeverity] ?? SEVERITY_STYLES.info
}
