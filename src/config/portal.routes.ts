import { isPortalStandalone, portalPaths } from '@/config/portal-paths'

/** Routes React Router (relatives au routeur portail). */
export const PORTAL_ROUTES = {
  LOGIN: portalPaths.login(),
  REGISTER: portalPaths.register(),
  DASHBOARD: portalPaths.dashboard(),
  INTERVENTIONS: portalPaths.interventions(),
  INTERVENTION_DETAIL: isPortalStandalone ? '/interventions/:id' : '/portal/interventions/:id',
  APPOINTMENTS: portalPaths.appointments(),
  QUOTES: portalPaths.quotes(),
  QUOTE_DETAIL: isPortalStandalone ? '/quotes/:id' : '/portal/quotes/:id',
  INVOICES: portalPaths.invoices(),
  HISTORY: portalPaths.history(),
  MESSAGES: portalPaths.messages(),
  NOTIFICATIONS: portalPaths.notifications(),
} as const

export type PortalRoute = (typeof PORTAL_ROUTES)[keyof typeof PORTAL_ROUTES]

export const PORTAL_NAV_ITEMS = [
  { path: PORTAL_ROUTES.DASHBOARD, label: 'Accueil', icon: 'home' as const },
  { path: PORTAL_ROUTES.INTERVENTIONS, label: 'Réparations', icon: 'wrench' as const },
  { path: PORTAL_ROUTES.APPOINTMENTS, label: 'Rendez-vous', icon: 'calendar' as const },
  { path: PORTAL_ROUTES.QUOTES, label: 'Devis', icon: 'file' as const },
  { path: PORTAL_ROUTES.INVOICES, label: 'Factures', icon: 'receipt' as const },
  { path: PORTAL_ROUTES.MESSAGES, label: 'Messages', icon: 'message' as const },
  { path: PORTAL_ROUTES.HISTORY, label: 'Historique', icon: 'history' as const },
] as const
