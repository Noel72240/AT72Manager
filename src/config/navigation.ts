import {
  BarChart3,
  Bot,
  ClipboardList,
  Cpu,
  LayoutDashboard,
  Settings,
  Users,
  Warehouse,
  Package,
  Bell,
  CalendarDays,
  MessageCircle,
} from 'lucide-react'
import { ROUTES } from '@/config/routes'
import type { NavItem } from '@/types'

export const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    path: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    id: 'interventions',
    label: 'Interventions',
    path: ROUTES.INTERVENTIONS,
    icon: ClipboardList,
  },
  {
    id: 'calendar',
    label: 'Planning',
    path: ROUTES.CALENDAR,
    icon: CalendarDays,
  },
  {
    id: 'clients',
    label: 'Clients',
    path: ROUTES.CLIENTS,
    icon: Users,
  },
  {
    id: 'devices',
    label: 'Appareils',
    path: ROUTES.DEVICES,
    icon: Cpu,
  },
  {
    id: 'parts',
    label: 'Pièces',
    path: ROUTES.PARTS,
    icon: Package,
  },
  {
    id: 'stock',
    label: 'Stock',
    path: ROUTES.STOCK,
    icon: Warehouse,
  },
  {
    id: 'activity',
    label: 'Activité',
    path: ROUTES.ACTIVITY,
    icon: Bell,
  },
  {
    id: 'portal-messages',
    label: 'Messages portail',
    path: ROUTES.PORTAL_MESSAGES,
    icon: MessageCircle,
  },
  {
    id: 'assistant',
    label: 'Assistant IA',
    path: ROUTES.ASSISTANT,
    icon: Bot,
  },
  {
    id: 'reports',
    label: 'Rapports',
    path: ROUTES.REPORTS,
    icon: BarChart3,
    disabled: true,
  },
  {
    id: 'settings',
    label: 'Paramètres',
    path: ROUTES.SETTINGS,
    icon: Settings,
    badge: 'Premium',
  },
]
