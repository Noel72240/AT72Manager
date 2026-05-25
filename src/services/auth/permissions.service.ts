import {
  ROLE_PERMISSIONS,
  type PermissionAction,
  type PermissionCheck,
  type PermissionResource,
} from '@/types/permissions.types'
import type { UserRole } from '@/types/user.types'

export function can(role: UserRole | undefined, resource: PermissionResource, action: PermissionAction): boolean {
  if (!role) return false
  const allowed = ROLE_PERMISSIONS[role][resource]
  if (!allowed || allowed.length === 0) return false
  return allowed.includes(action)
}

export function canAny(role: UserRole | undefined, checks: PermissionCheck[]): boolean {
  return checks.some(({ resource, action }) => can(role, resource, action))
}

export function canAll(role: UserRole | undefined, checks: PermissionCheck[]): boolean {
  return checks.every(({ resource, action }) => can(role, resource, action))
}

export function assertPermission(
  role: UserRole | undefined,
  resource: PermissionResource,
  action: PermissionAction,
): void {
  if (!can(role, resource, action)) {
    throw new PermissionDeniedError(resource, action)
  }
}

export class PermissionDeniedError extends Error {
  resource: PermissionResource
  action: PermissionAction

  constructor(resource: PermissionResource, action: PermissionAction) {
    super(`Permission refusée : ${action} sur ${resource}`)
    this.name = 'PermissionDeniedError'
    this.resource = resource
    this.action = action
  }
}

/** Mapping navigation → permission lecture */
export const NAV_READ_PERMISSIONS: Partial<Record<string, PermissionResource>> = {
  clients: 'clients',
  interventions: 'interventions',
  devices: 'clients',
  quotes: 'quotes',
  invoices: 'invoices',
  parts: 'stock',
  stock: 'stock',
  calendar: 'interventions',
  activity: 'audit',
  assistant: 'ai',
  settings: 'settings',
}
