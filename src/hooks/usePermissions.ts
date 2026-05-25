import { useCallback, useMemo } from 'react'
import { can, canAll, canAny } from '@/services/auth/permissions.service'
import { useAuthStore } from '@/store/auth.store'
import type { PermissionAction, PermissionCheck, PermissionResource } from '@/types/permissions.types'
import type { UserRole } from '@/types/user.types'

export function usePermissions() {
  const role = useAuthStore((state) => state.user?.role)

  const permissions = useMemo(
    () => ({
      role,
      can: (resource: PermissionResource, action: PermissionAction) => can(role, resource, action),
      canAny: (checks: PermissionCheck[]) => canAny(role, checks),
      canAll: (checks: PermissionCheck[]) => canAll(role, checks),
      isAdmin: role === 'admin',
      isReadOnly: role === 'readonly',
    }),
    [role],
  )

  const assertCan = useCallback(
    (resource: PermissionResource, action: PermissionAction) => {
      if (!can(role, resource, action)) {
        throw new Error(`Permission refusée : ${action} / ${resource}`)
      }
    },
    [role],
  )

  return { ...permissions, assertCan }
}

export function useRole(): UserRole | undefined {
  return useAuthStore((state) => state.user?.role)
}
