import { Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from '@/config/routes'
import { LoadingPage } from '@/pages/LoadingPage'
import { useAuthStore } from '@/store/auth.store'

export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status)
  const initialized = useAuthStore((state) => state.initialized)

  if (!initialized || status === 'loading' || status === 'idle') {
    return <LoadingPage />
  }

  if (status !== 'authenticated') {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return <Outlet />
}
