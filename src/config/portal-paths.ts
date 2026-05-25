/**
 * Chemins du portail client.
 * - Standalone (Vercel) : /login, /interventions, …
 * - Intégré desktop (hash) : /portal/login, …
 */
export const isPortalStandalone = import.meta.env.VITE_PORTAL_STANDALONE === 'true'

function portalPrefix(segment: string): string {
  const path = segment.startsWith('/') ? segment : `/${segment}`
  if (isPortalStandalone) {
    return path === '/' ? '/' : path
  }
  if (path === '/') return '/portal'
  return `/portal${path}`
}

export const portalPaths = {
  login: () => portalPrefix('/login'),
  register: () => portalPrefix('/register'),
  dashboard: () => (isPortalStandalone ? '/' : '/portal'),
  interventions: () => portalPrefix('/interventions'),
  interventionDetail: (id: string) => portalPrefix(`/interventions/${id}`),
  appointments: () => portalPrefix('/appointments'),
  quotes: () => portalPrefix('/quotes'),
  quoteDetail: (id: string) => portalPrefix(`/quotes/${id}`),
  invoices: () => portalPrefix('/invoices'),
  history: () => portalPrefix('/history'),
  messages: () => portalPrefix('/messages'),
  notifications: () => portalPrefix('/notifications'),
} as const
