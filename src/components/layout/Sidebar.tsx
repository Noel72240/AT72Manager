import { motion } from 'framer-motion'
import { NavLink, useLocation } from 'react-router-dom'
import { filterNavigationByRole } from '@/config/navigation-filter'
import { Logo } from '@/components/ui/Logo'
import { SidebarNavItem } from '@/components/layout/SidebarNavItem'
import { fadeIn, staggerContainer } from '@/utils/motion'
import { cn } from '@/utils/cn'
import { useFeedStore } from '@/store/feed.store'
import { useAuthStore } from '@/store/auth.store'

type SidebarProps = {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation()
  const setPanelOpen = useFeedStore((state) => state.setPanelOpen)
  const role = useAuthStore((state) => state.user?.role)
  const visibleItems = filterNavigationByRole(role)

  return (
    <aside
      className={cn(
        'relative z-[60] flex w-[260px] shrink-0 flex-col border-r border-border glass',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-neon-blue/5 to-transparent"
      />

      <div className="relative border-b border-border-subtle px-5 py-5">
        <Logo size="sm" />
      </div>

      <motion.nav
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative flex-1 space-y-0.5 p-3"
        aria-label="Navigation principale"
      >
        <motion.p
          variants={fadeIn}
          className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-text-muted"
        >
          Menu
        </motion.p>
        {visibleItems.map((item) => (
          <motion.div key={item.id} variants={fadeIn}>
            <NavLink
              to={item.path}
              className="block"
              tabIndex={item.disabled ? -1 : 0}
              aria-disabled={item.disabled}
              onClick={() => setPanelOpen(false)}
            >
              <SidebarNavItem
                label={item.label}
                icon={item.icon}
                isActive={location.pathname === item.path}
                disabled={item.disabled}
                badge={item.badge}
              />
            </NavLink>
          </motion.div>
        ))}
      </motion.nav>

      <div className="relative border-t border-border-subtle p-4">
        <div className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-surface-elevated/50 px-3 py-2.5">
          <Logo size="sm" markOnly />
          <div>
            <p className="text-xs font-medium text-text-secondary">AT72Manager</p>
            <p className="mt-0.5 text-[11px] text-text-muted">Desktop · v0.1</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
