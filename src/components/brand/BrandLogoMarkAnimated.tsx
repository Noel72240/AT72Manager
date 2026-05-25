import { motion } from 'framer-motion'
import { BrandLogoMark } from '@/components/brand/BrandLogoMark'
import { cn } from '@/utils/cn'

type BrandLogoMarkAnimatedProps = {
  className?: string
}

export function BrandLogoMarkAnimated({ className }: BrandLogoMarkAnimatedProps) {
  return (
    <div className={cn('relative size-[104px] shrink-0', className)}>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[28px] bg-neon-blue/12 blur-2xl"
        animate={{ opacity: [0.35, 0.52, 0.35] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transform: 'translateZ(0)' }}
      />

      <motion.div
        className="relative size-full"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ transform: 'translateZ(0)' }}
      >
        <BrandLogoMark
          className="size-full drop-shadow-[0_8px_32px_rgba(0,207,255,0.25)]"
          glow
        />

        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-3 rounded-[18px] border border-neon-blue/12"
          animate={{ opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  )
}
