import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type LegalProseProps = {
  children: ReactNode
  className?: string
}

export function LegalProse({ children, className }: LegalProseProps) {
  return (
    <article
      className={cn(
        'legal-prose max-w-none text-sm leading-relaxed text-text-secondary',
        '[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-text-primary',
        '[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-text-primary',
        '[&_p]:mb-3 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5',
        '[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5',
        '[&_li]:text-text-secondary [&_a]:text-neon-blue [&_a]:underline [&_a]:underline-offset-2',
        '[&_strong]:font-medium [&_strong]:text-text-primary',
        className,
      )}
    >
      {children}
    </article>
  )
}

type LegalSectionProps = {
  id?: string
  title: string
  children: ReactNode
}

export function LegalSection({ id, title, children }: LegalSectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2>{title}</h2>
      {children}
    </section>
  )
}
