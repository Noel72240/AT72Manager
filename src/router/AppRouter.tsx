import { Navigate, Route, Routes } from 'react-router-dom'
import { RoleRoute } from '@/components/auth/RoleRoute'
import { ROUTES } from '@/config/routes'
import { AppLayout } from '@/layouts/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { DevicesPage } from '@/modules/devices/pages/DevicesPage'
import { InterventionsPage } from '@/modules/interventions/pages/InterventionsPage'
import { ProtectedRoute } from '@/router/ProtectedRoute'
import { PublicRoute } from '@/router/PublicRoute'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { ClientsPage } from '@/modules/clients/pages/ClientsPage'
import { PartsPage } from '@/modules/parts/pages/PartsPage'
import { StockPage } from '@/modules/stock/pages/StockPage'
import { CalendarPage } from '@/modules/calendar/pages/CalendarPage'
import { ActivityPage } from '@/features/notifications/pages/ActivityPage'
import { AiAssistantPage } from '@/modules/ai/pages/AiAssistantPage'
import { SettingsPage } from '@/modules/settings/pages/SettingsPage'
import { WorkshopPortalInboxPage } from '@/modules/portal-workshop/pages/WorkshopPortalInboxPage'
import { PortalRouter } from '@/router/portal/PortalRouter'
import { PortalExternalRedirect } from '@/router/portal/PortalExternalRedirect'
import { env } from '@/config/env'

export function AppRouter() {
  return (
    <Routes>
        <Route
          path="/portal/*"
          element={env.portalPublicUrl ? <PortalExternalRedirect /> : <PortalRouter />}
        />

        <Route element={<PublicRoute />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path={ROUTES.INTERVENTIONS} element={<InterventionsPage />} />
            <Route path={ROUTES.CLIENTS} element={<ClientsPage />} />
            <Route path={ROUTES.DEVICES} element={<DevicesPage />} />
            <Route path={ROUTES.PARTS} element={<PartsPage />} />
            <Route path={ROUTES.STOCK} element={<StockPage />} />
            <Route path={ROUTES.CALENDAR} element={<CalendarPage />} />
            <Route path={ROUTES.ACTIVITY} element={<ActivityPage />} />
            <Route path={ROUTES.PORTAL_MESSAGES} element={<WorkshopPortalInboxPage />} />
            <Route path={ROUTES.ASSISTANT} element={<AiAssistantPage />} />
            <Route path={ROUTES.REPORTS} element={<PlaceholderPage title="Rapports" />} />
            <Route element={<RoleRoute resource="settings" action="read" />}>
              <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
