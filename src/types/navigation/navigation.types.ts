import type { LucideIcon } from 'lucide-react'

export type NavItemId =
  | 'dashboard'
  | 'interventions'
  | 'clients'
  | 'devices'
  | 'quotes'
  | 'invoices'
  | 'parts'
  | 'stock'
  | 'calendar'
  | 'activity'
  | 'portal-messages'
  | 'assistant'
  | 'reports'
  | 'settings'

export type NavItem = {
  id: NavItemId
  label: string
  path: string
  icon: LucideIcon
  disabled?: boolean
  badge?: string
}
