import type { UserRole } from '@/types/user.types'

export type PermissionResource =
  | 'clients'
  | 'interventions'
  | 'stock'
  | 'backups'
  | 'ai'
  | 'settings'
  | 'users'
  | 'audit'

export type PermissionAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'
  | 'manage'

export type PermissionCheck = {
  resource: PermissionResource
  action: PermissionAction
}

/** Matrice RBAC — extensible pour MFA, invités, permissions avancées */
export const ROLE_PERMISSIONS: Record<
  UserRole,
  Partial<Record<PermissionResource, readonly PermissionAction[]>>
> = {
  admin: {
    clients: ['read', 'create', 'update', 'delete'],
    interventions: ['read', 'create', 'update', 'delete'],
    stock: ['read', 'create', 'update', 'delete'],
    backups: ['read', 'create', 'restore', 'delete', 'manage'],
    ai: ['read', 'create', 'update', 'delete'],
    settings: ['read', 'update', 'manage'],
    users: ['read', 'create', 'update', 'delete', 'manage'],
    audit: ['read', 'manage'],
  },
  manager: {
    clients: ['read', 'create', 'update', 'delete'],
    interventions: ['read', 'create', 'update', 'delete'],
    stock: ['read', 'update'],
    backups: ['read'],
    ai: ['read', 'create', 'update'],
    settings: ['read'],
    users: ['read'],
    audit: ['read'],
  },
  technician: {
    clients: ['read', 'create', 'update'],
    interventions: ['read', 'create', 'update', 'delete'],
    stock: ['read', 'update'],
    ai: ['read', 'create', 'update'],
    settings: [],
  },
  readonly: {
    clients: ['read'],
    interventions: ['read'],
    stock: ['read'],
    ai: ['read'],
    settings: [],
  },
}

export const USER_ROLES: UserRole[] = ['admin', 'manager', 'technician', 'readonly']
