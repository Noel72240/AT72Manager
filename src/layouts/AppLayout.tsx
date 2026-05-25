import { Outlet, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { getRouteTitle } from '@/config/routes'

export function AppLayout() {
  const location = useLocation()
  const title = getRouteTitle(location.pathname)

  return (
    <AppShell pageTitle={title}>
      <ErrorBoundary key={location.pathname} title="Impossible d’afficher cette page">
        <Outlet />
      </ErrorBoundary>
    </AppShell>
  )
}