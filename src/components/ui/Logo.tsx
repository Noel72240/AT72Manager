import { cn } from '@/utils/cn'
import { BrandLogoMark, type BrandMarkSize } from '@/components/brand/BrandLogoMark'
import { BrandWordmark, type BrandWordmarkSize } from '@/components/brand/BrandWordmark'

type LogoProps = {
  className?: string
  showSubtitle?: boolean
  size?: 'sm' | 'md' | 'lg'
  centered?: boolean
  markOnly?: boolean
}

const layout = {
  sm: { mark: 'sm' as BrandMarkSize, word: 'sm' as BrandWordmarkSize, gap: 'gap-2.5' },
  md: { mark: 'md' as BrandMarkSize, word: 'md' as BrandWordmarkSize, gap: 'gap-3' },
  lg: { mark: 'lg' as BrandMarkSize, word: 'lg' as BrandWordmarkSize, gap: 'gap-4' },
} as const

export function Logo({
  className,
  showSubtitle = false,
  size = 'md',
  centered = false,
  markOnly = false,
}: LogoProps) {
  const styles = layout[size]

  return (
    <div
      className={cn(
        'flex flex-col gap-1',
        centered ? 'items-center' : 'items-start',
        className,
      )}
    >
      <div className={cn('flex items-center', styles.gap)}>
        <BrandLogoMark
          size={styles.mark}
          className="shrink-0 drop-shadow-[0_4px_20px_rgba(0,207,255,0.2)]"
        />
        {!markOnly && <BrandWordmark size={styles.word} />}
      </div>
      {showSubtitle && (
        <p className="text-sm text-text-muted">Suite atelier professionnelle</p>
      )}
    </div>
  )
}
