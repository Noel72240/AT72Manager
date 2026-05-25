import { Route, Routes } from 'react-router-dom'
import { PortalLayout } from '@/modules/portal/layouts/PortalLayout'
import { PortalLoginPage } from '@/modules/portal/pages/PortalLoginPage'
import { PortalRegisterPage } from '@/modules/portal/pages/PortalRegisterPage'
import { PortalDashboardPage } from '@/modules/portal/pages/PortalDashboardPage'
import { PortalInterventionsPage } from '@/modules/portal/pages/PortalInterventionsPage'
import { PortalInterventionDetailPage } from '@/modules/portal/pages/PortalInterventionDetailPage'
import { PortalAppointmentsPage } from '@/modules/portal/pages/PortalAppointmentsPage'
import { PortalQuotesPage } from '@/modules/portal/pages/PortalQuotesPage'
import { PortalQuoteDetailPage } from '@/modules/portal/pages/PortalQuoteDetailPage'
import { PortalInvoicesPage } from '@/modules/portal/pages/PortalInvoicesPage'
import { PortalHistoryPage } from '@/modules/portal/pages/PortalHistoryPage'
import { PortalMessagesPage } from '@/modules/portal/pages/PortalMessagesPage'
import { PortalNotificationsPage } from '@/modules/portal/pages/PortalNotificationsPage'
import { PortalAuthBridge } from '@/modules/portal/components/PortalAuthBridge'
import { PortalCguPage } from '@/modules/portal/legal/pages/PortalCguPage'
import { PortalLegalMentionsPage } from '@/modules/portal/legal/pages/PortalLegalMentionsPage'
import { PortalPrivacyPolicyPage } from '@/modules/portal/legal/pages/PortalPrivacyPolicyPage'
import { PortalProtectedRoute } from '@/router/portal/PortalProtectedRoute'
import { PortalPublicRoute } from '@/router/portal/PortalPublicRoute'

export function PortalRouter() {
  return (
    <>
      <PortalAuthBridge />
      <Routes>
      <Route path="mentions-legales" element={<PortalLegalMentionsPage />} />
      <Route path="politique-confidentialite" element={<PortalPrivacyPolicyPage />} />
      <Route path="cgu" element={<PortalCguPage />} />

      <Route element={<PortalPublicRoute />}>
        <Route path="login" element={<PortalLoginPage />} />
        <Route path="register" element={<PortalRegisterPage />} />
      </Route>

      <Route element={<PortalProtectedRoute />}>
        <Route element={<PortalLayout />}>
          <Route index element={<PortalDashboardPage />} />
          <Route path="interventions" element={<PortalInterventionsPage />} />
          <Route path="interventions/:id" element={<PortalInterventionDetailPage />} />
          <Route path="appointments" element={<PortalAppointmentsPage />} />
          <Route path="quotes" element={<PortalQuotesPage />} />
          <Route path="quotes/:id" element={<PortalQuoteDetailPage />} />
          <Route path="invoices" element={<PortalInvoicesPage />} />
          <Route path="history" element={<PortalHistoryPage />} />
          <Route path="messages" element={<PortalMessagesPage />} />
          <Route path="notifications" element={<PortalNotificationsPage />} />
        </Route>
      </Route>
      </Routes>
    </>
  )
}
