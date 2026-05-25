import { cn } from '@/utils/cn'

export const buttonVariants = {
  primary: cn(
    'bg-primary text-background font-medium',
    'hover:bg-primary-hover',
    'ring-1 ring-neon-blue/30',
  ),
  secondary: cn(
    'bg-surface-elevated text-text-primary font-medium',
    'border border-border',
    'hover:bg-surface-hover hover:border-neon-blue/20',
  ),
  ghost: cn(
    'text-text-secondary font-medium',
    'hover:bg-surface-hover hover:text-text-primary',
  ),
  danger: cn(
    'bg-danger/10 text-danger font-medium',
    'ring-1 ring-danger/20',
    'hover:bg-danger/20',
  ),
} as const

export const buttonSizes = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-9 px-4 text-sm rounded-lg gap-2',
  lg: 'h-10 px-5 text-sm rounded-xl gap-2',
} as const

export const badgeVariants = {
  default: 'bg-surface-hover text-text-secondary ring-1 ring-border',
  primary: 'bg-primary-muted text-neon-blue ring-1 ring-neon-blue/20',
  success: 'bg-accent-muted text-neon-green ring-1 ring-neon-green/20',
  warning: 'bg-warning/10 text-warning ring-1 ring-warning/20',
  danger: 'bg-danger/10 text-danger ring-1 ring-danger/20',
} as const

export const inputVariants = {
  default: cn(
    'bg-surface-elevated/80 border border-border text-text-primary',
    'placeholder:text-text-muted',
    'focus:border-neon-blue/40 focus:ring-2 focus:ring-neon-blue/15',
  ),
} as const

export type ButtonVariant = keyof typeof buttonVariants
export type ButtonSize = keyof typeof buttonSizes
export type BadgeVariant = keyof typeof badgeVariants
