import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { springTransition } from '@/utils/motion'
import { cn } from '@/utils/cn'

type SidebarNavItemProps = {
  label: string
  icon: LucideIcon
  isActive: boolean
  disabled?: boolean
  badge?: string
  className?: string
}

export function SidebarNavItem({
  label,
  icon: Icon,
  isActive,
  disabled,
  badge,
  className,
}: SidebarNavItemProps) {
  return (
    <div
      aria-current={isActive ? 'page' : undefined}
      aria-disabled={disabled}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium outline-none',
        'transition-colors duration-200',
        isActive
          ? 'text-neon-blue'
          : 'text-text-secondary hover:text-text-primary',
        disabled && 'pointer-events-none opacity-35',
        className,
      )}
    >
      {isActive && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-lg bg-primary-muted ring-1 ring-neon-blue/20"
          transition={springTransition}
        />
      )}

      <motion.span
        className="relative flex size-8 items-center justify-center rounded-md"
        whileHover={disabled ? undefined : { scale: 1.05 }}
        whileTap={disabled ? undefined : { scale: 0.97 }}
      >
        <Icon
          className={cn(
            'size-[18px] transition-colors duration-200',
            isActive
              ? 'text-neon-blue'
              : 'text-text-muted group-hover:text-text-secondary',
          )}
          strokeWidth={isActive ? 2 : 1.75}
        />
      </motion.span>

      <span className="relative flex-1">{label}</span>

      {badge && (
        <span className="relative rounded-md bg-accent-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neon-green ring-1 ring-neon-green/25">
          {badge}
        </span>
      )}

      {isActive && (
        <motion.span
          layoutId="sidebar-indicator"
          className="absolute -left-3 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-neon-blue glow-blue"
          transition={springTransition}
        />
      )}
    </div>
  )
}
