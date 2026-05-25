import { create } from 'zustand'
import { ROUTES } from '@/config/routes'

export type CommandItem = {
  id: string
  label: string
  group: string
  keywords?: string
  href?: string
  action?: () => void | Promise<void>
}

type CommandPaletteStore = {
  open: boolean
  query: string
  recent: string[]
  setOpen: (open: boolean) => void
  toggle: () => void
  setQuery: (query: string) => void
  pushRecent: (id: string) => void
}

export const COMMAND_ITEMS: CommandItem[] = [
  { id: 'nav-dashboard', label: 'Tableau de bord', group: 'Navigation', href: ROUTES.DASHBOARD, keywords: 'home accueil' },
  { id: 'nav-clients', label: 'Clients', group: 'Navigation', href: ROUTES.CLIENTS },
  { id: 'nav-interventions', label: 'Interventions', group: 'Navigation', href: ROUTES.INTERVENTIONS },
  { id: 'nav-calendar', label: 'Planning', group: 'Navigation', href: ROUTES.CALENDAR, keywords: 'agenda rdv' },
  { id: 'nav-stock', label: 'Stock', group: 'Navigation', href: ROUTES.STOCK },
  { id: 'nav-parts', label: 'Pièces', group: 'Navigation', href: ROUTES.PARTS },
  { id: 'nav-settings', label: 'Paramètres', group: 'Navigation', href: `${ROUTES.SETTINGS}?tab=backup`, keywords: 'settings config' },
  { id: 'nav-integrations', label: 'Intégrations Google Calendar', group: 'Navigation', href: `${ROUTES.SETTINGS}?tab=integrations` },
  { id: 'nav-ai', label: 'Assistant IA', group: 'Navigation', href: ROUTES.ASSISTANT, keywords: 'chat assistant' },
]

export const useCommandPaletteStore = create<CommandPaletteStore>((set, get) => ({
  open: false,
  query: '',
  recent: [],
  setOpen: (open) => set({ open, query: open ? get().query : '' }),
  toggle: () => set((state) => ({ open: !state.open, query: state.open ? '' : state.query })),
  setQuery: (query) => set({ query }),
  pushRecent: (id) =>
    set((state) => ({
      recent: [id, ...state.recent.filter((item) => item !== id)].slice(0, 8),
    })),
}))
