import type { ReactNode } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import type { PermissionAction, PermissionResource } from '@/types/permissions.types'

type PermissionGateProps = {
  resource: PermissionResource
  action: PermissionAction
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGate({ resource, action, children, fallback = null }: PermissionGateProps) {
  const { can } = usePermissions()
  if (!can(resource, action)) return <>{fallback}</>
  return <>{children}</>
}
