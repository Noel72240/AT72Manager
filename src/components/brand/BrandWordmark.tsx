import { cn } from '@/utils/cn'

export type BrandWordmarkSize = 'sm' | 'md' | 'lg' | 'xl'

const wordmarkSizes: Record<BrandWordmarkSize, string> = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-3xl sm:text-4xl',
  xl: 'text-[2rem] sm:text-[2.35rem]',
}

type BrandWordmarkProps = {
  className?: string
  size?: BrandWordmarkSize
  centered?: boolean
}

/** Wordmark AT72Manager — AT blanc · 72 cyan · Manager dégradé */
export function BrandWordmark({ className, size = 'md', centered }: BrandWordmarkProps) {
  return (
    <span
      className={cn(
        'inline-flex items-baseline font-semibold leading-none tracking-tight',
        wordmarkSizes[size],
        centered && 'justify-center',
        className,
      )}
    >
      <span className="text-text-primary">AT</span>
      <span className="text-neon-blue drop-shadow-[0_0_14px_rgba(0,207,255,0.45)]">72</span>
      <span className="bg-linear-to-r from-neon-blue via-neon-blue to-neon-green bg-clip-text text-transparent">
        Manager
      </span>
    </span>
  )
}
