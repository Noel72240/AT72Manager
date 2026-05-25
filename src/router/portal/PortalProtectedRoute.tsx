import { Navigate, Outlet } from 'react-router-dom'
import { PORTAL_ROUTES } from '@/config/portal.routes'
import { PortalLoadingPage } from '@/modules/portal/pages/PortalLoadingPage'
import { usePortalAuthStore } from '@/store/portal-auth.store'

export function PortalProtectedRoute() {
  const status = usePortalAuthStore((s) => s.status)
  const initialized = usePortalAuthStore((s) => s.initialized)

  if (!initialized || status === 'loading') {
    return <PortalLoadingPage />
  }

  if (status !== 'authenticated') {
    return <Navigate to={PORTAL_ROUTES.LOGIN} replace />
  }

  return <Outlet />
}
