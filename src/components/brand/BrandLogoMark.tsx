import { useId } from 'react'
import { cn } from '@/utils/cn'

export type BrandMarkSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const markSizes: Record<BrandMarkSize, string> = {
  xs: 'size-7',
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-14',
  xl: 'size-[104px]',
}

type BrandLogoMarkProps = {
  className?: string
  size?: BrandMarkSize
  glow?: boolean
}

/** Icône premium AT72Manager — chevron A néon, bordure pointillée, accents circuit */
export function BrandLogoMark({ className, size, glow = true }: BrandLogoMarkProps) {
  const uid = useId().replace(/:/g, '')
  const gradId = `brand-grad-${uid}`
  const surfId = `brand-surf-${uid}`
  const glowId = `brand-glow-${uid}`

  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(size ? markSizes[size] : undefined, className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="12" y1="8" x2="84" y2="88">
          <stop offset="0%" stopColor="#00cfff" />
          <stop offset="55%" stopColor="#00e5ff" />
          <stop offset="100%" stopColor="#00ff94" />
        </linearGradient>
        <linearGradient id={surfId} x1="48" y1="8" x2="48" y2="88">
          <stop offset="0%" stopColor="#1a2332" />
          <stop offset="100%" stopColor="#0d1118" />
        </linearGradient>
        {glow && (
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <rect
        x="8"
        y="8"
        width="80"
        height="80"
        rx="22"
        fill={`url(#${surfId})`}
        stroke={`url(#${gradId})`}
        strokeWidth="1.25"
        strokeOpacity="0.4"
      />

      <rect
        x="14"
        y="14"
        width="68"
        height="68"
        rx="18"
        stroke={`url(#${gradId})`}
        strokeWidth="0.75"
        strokeOpacity="0.22"
        strokeDasharray="4 6"
      />

      <g filter={glow ? `url(#${glowId})` : undefined}>
        <path
          d="M36 62 L48 32 L60 62"
          stroke={`url(#${gradId})`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      <circle cx="24" cy="24" r="2.25" fill="#00cfff" fillOpacity="0.6" />
      <circle cx="72" cy="24" r="2.25" fill="#00ff94" fillOpacity="0.55" />
      <circle cx="24" cy="72" r="1.75" fill="#00cfff" fillOpacity="0.35" />
      <circle cx="72" cy="72" r="1.75" fill="#00ff94" fillOpacity="0.35" />

      <path
        d="M28 74 H42 M54 74 H68"
        stroke="#00cfff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.35"
      />
    </svg>
  )
}
