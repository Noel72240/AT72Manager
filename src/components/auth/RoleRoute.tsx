import { Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from '@/config/routes'
import { usePermissions } from '@/hooks/usePermissions'
import type { PermissionAction, PermissionResource } from '@/types/permissions.types'

type RoleRouteProps = {
  resource: PermissionResource
  action: PermissionAction
  redirectTo?: string
}

export function RoleRoute({
  resource,
  action,
  redirectTo = ROUTES.DASHBOARD,
}: RoleRouteProps) {
  const { can } = usePermissions()

  if (!can(resource, action)) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
