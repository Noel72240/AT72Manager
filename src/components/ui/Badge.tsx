import { cn } from '@/utils/cn'
import { badgeVariants, type BadgeVariant } from '@/theme/variants'

type BadgeProps = {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium',
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
