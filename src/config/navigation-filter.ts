import { navigationItems } from '@/config/navigation'
import { NAV_READ_PERMISSIONS } from '@/services/auth/permissions.service'
import { can } from '@/services/auth/permissions.service'
import type { NavItem } from '@/types'
import type { UserRole } from '@/types/user.types'

export function filterNavigationByRole(role: UserRole | undefined): NavItem[] {
  return navigationItems.filter((item) => {
    if (item.disabled) return true

    const resource = NAV_READ_PERMISSIONS[item.id]
    if (!resource) return true

    return can(role, resource, 'read')
  })
}
