import { motion } from 'framer-motion'
import { BrandLogoMarkAnimated } from '@/components/brand/BrandLogoMarkAnimated'
import { BrandWordmark } from '@/components/brand/BrandWordmark'
import { cn } from '@/utils/cn'
import { smoothTransition } from '@/utils/motion'

type StartupLogoProps = {
  className?: string
}

export function StartupLogo({ className }: StartupLogoProps) {
  return (
    <div className={cn('relative flex w-full flex-col items-center', className)}>
      <BrandLogoMarkAnimated />

      <motion.div
        className="mt-7 w-full text-center"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, ...smoothTransition }}
      >
        <BrandWordmark size="xl" centered className="justify-center" />
        <p className="mt-3 text-sm tracking-wide text-text-muted">
          Suite atelier professionnelle
        </p>
      </motion.div>
    </div>
  )
}
