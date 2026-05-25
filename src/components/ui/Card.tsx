import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { scaleIn } from '@/utils/motion'

type CardProps = {
  children: ReactNode
  className?: string
  title?: string
  description?: string
  animated?: boolean
  hover?: boolean
}

export function Card({
  children,
  className,
  title,
  description,
  animated = false,
  hover = false,
}: CardProps) {
  const motionProps = animated
    ? { variants: scaleIn, initial: 'hidden' as const, animate: 'visible' as const }
    : {}

  if (animated) {
    return (
      <motion.section
        {...motionProps}
        className={cn(
          'rounded-xl border border-border bg-surface-elevated/80 p-6 shadow-card glass-elevated',
          hover && 'transition-shadow duration-300 hover:shadow-card-hover',
          className,
        )}
      >
        {(title || description) && (
          <header className="mb-5">
            {title && (
              <h3 className="text-sm font-semibold tracking-tight text-text-primary">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-sm text-text-muted">{description}</p>
            )}
          </header>
        )}
        {children}
      </motion.section>
    )
  }

  return (
    <section
      className={cn(
        'rounded-xl border border-border bg-surface-elevated/80 p-6 shadow-card glass-elevated',
        hover && 'transition-shadow duration-300 hover:shadow-card-hover',
        className,
      )}
    >
      {(title || description) && (
        <header className="mb-5">
          {title && (
            <h3 className="text-sm font-semibold tracking-tight text-text-primary">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-text-muted">{description}</p>
          )}
        </header>
      )}
      {children}
    </section>
  )
}
