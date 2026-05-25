import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type MainContentProps = {
  children: ReactNode
  className?: string
}

export function MainContent({ children, className }: MainContentProps) {
  return (
    <main className={cn('flex-1 overflow-y-auto bg-background/50', className)}>
      {children}
    </main>
  )
}
