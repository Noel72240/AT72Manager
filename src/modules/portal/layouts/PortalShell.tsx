import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Calendar,
  FileText,
  History,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Receipt,
  Wrench,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PORTAL_ROUTES, PORTAL_NAV_ITEMS } from '@/config/portal.routes'
import { BrandWordmark } from '@/components/brand/BrandWordmark'
import { usePortalAuthStore } from '@/store/portal-auth.store'
import { usePortalDataStore } from '@/store/portal-data.store'
import { cn } from '@/utils/cn'

const ICONS = {
  home: Home,
  wrench: Wrench,
  calendar: Calendar,
  file: FileText,
  receipt: Receipt,
  message: MessageCircle,
  history: History,
} as const

type PortalShellProps = { children: ReactNode }

export function PortalShell({ children }: PortalShellProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const session = usePortalAuthStore((s) => s.session)
  const signOut = usePortalAuthStore((s) => s.signOut)
  const unread = usePortalDataStore(
    (s) => s.notifications.filter((n) => !n.readAt).length,
  )

  async function handleSignOut() {
    await signOut()
    navigate(PORTAL_ROUTES.LOGIN, { replace: true })
  }

  const navLink = (path: string, label: string, Icon: typeof Home) => {
    const active = location.pathname === path || location.pathname.startsWith(`${path}/`)
    return (
      <Link
        key={path}
        to={path}
        onClick={() => setMenuOpen(false)}
        className={cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
          active
            ? 'bg-neon-blue/15 text-neon-blue'
            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
        )}
      >
        <Icon className="size-4 shrink-0" />
        {label}
      </Link>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(0,207,255,0.08),transparent)]" />

      <aside className="relative z-20 hidden w-64 shrink-0 flex-col border-r border-border bg-surface/80 backdrop-blur-xl lg:flex">
        <div className="border-b border-border p-5">
          <BrandWordmark size="md" />
          <p className="mt-2 text-xs text-text-muted">Espace client SAV</p>
          {session ? (
            <p className="mt-3 truncate text-sm font-medium text-text-primary">{session.fullName}</p>
          ) : null}
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {PORTAL_NAV_ITEMS.map((item) => navLink(item.path, item.label, ICONS[item.icon]))}
        </nav>
        <div className="border-t border-border p-3">
          <Link
            to={PORTAL_ROUTES.NOTIFICATIONS}
            className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover"
          >
            <Bell className="size-4" />
            Notifications
            {unread > 0 ? (
              <span className="ml-auto rounded-full bg-neon-blue px-2 py-0.5 text-[10px] font-bold text-background">
                {unread}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          >
            <LogOut className="size-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      <header className="relative z-20 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-lg lg:hidden">
        <BrandWordmark size="sm" />
        <div className="flex items-center gap-2">
          <Link
            to={PORTAL_ROUTES.NOTIFICATIONS}
            className="relative rounded-lg p-2 text-text-secondary hover:bg-surface-hover"
          >
            <Bell className="size-5" />
            {unread > 0 ? (
              <span className="absolute right-1 top-1 size-2 rounded-full bg-neon-blue" />
            ) : null}
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen ? (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-20 border-b border-border bg-surface lg:hidden"
          >
            <div className="flex flex-col gap-1 p-3">
              {PORTAL_NAV_ITEMS.map((item) => navLink(item.path, item.label, ICONS[item.icon]))}
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-secondary"
              >
                <LogOut className="size-4" />
                Déconnexion
              </button>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>

      <main className="portal-safe-bottom relative z-10 flex min-h-0 min-h-[100dvh] w-full flex-1 flex-col lg:min-h-0">
        {children}
      </main>
    </div>
  )
}
