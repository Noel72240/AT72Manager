export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  INTERVENTIONS: '/interventions',
  CLIENTS: '/clients',
  DEVICES: '/devices',
  PARTS: '/parts',
  STOCK: '/stock',
  CALENDAR: '/calendar',
  ACTIVITY: '/activity',
  PORTAL_MESSAGES: '/messages-portail',
  ASSISTANT: '/assistant',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

export const routeTitles: Record<AppRoute, string> = {
  [ROUTES.LOGIN]: 'Connexion',
  [ROUTES.DASHBOARD]: 'Tableau de bord',
  [ROUTES.INTERVENTIONS]: 'Interventions',
  [ROUTES.CLIENTS]: 'Clients',
  [ROUTES.DEVICES]: 'Appareils',
  [ROUTES.PARTS]: 'Pièces',
  [ROUTES.STOCK]: 'Stock',
  [ROUTES.CALENDAR]: 'Planning',
  [ROUTES.ACTIVITY]: 'Activité',
  [ROUTES.PORTAL_MESSAGES]: 'Messages portail',
  [ROUTES.ASSISTANT]: 'Assistant IA',
  [ROUTES.REPORTS]: 'Rapports',
  [ROUTES.SETTINGS]: 'Paramètres',
}

export function getRouteTitle(pathname: string): string {
  const route = Object.values(ROUTES).find((value) => value === pathname)
  return route ? routeTitles[route] : 'Page introuvable'
}
