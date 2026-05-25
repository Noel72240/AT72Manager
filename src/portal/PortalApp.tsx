import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PortalProviders } from '@/portal/PortalProviders'
import { PortalRouter } from '@/router/portal/PortalRouter'
import { PORTAL_ROUTES } from '@/config/portal.routes'
import { RootErrorBoundary } from '@/components/ui/RootErrorBoundary'

export function PortalApp() {
  return (
    <RootErrorBoundary>
      <PortalProviders>
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<PortalRouter />} />
            <Route path="*" element={<Navigate to={PORTAL_ROUTES.LOGIN} replace />} />
          </Routes>
        </BrowserRouter>
      </PortalProviders>
    </RootErrorBoundary>
  )
}
