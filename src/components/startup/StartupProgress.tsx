import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import { smoothTransition } from '@/utils/motion'

type StartupProgressProps = {
  progress: number
  className?: string
}

export function StartupProgress({ progress, className }: StartupProgressProps) {
  return (
    <motion.div
      layout={false}
      className={cn('w-full max-w-sm', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.45, ...smoothTransition }}
    >
      <motion.div
        layout={false}
        className="mb-3 flex items-center justify-between text-xs text-text-muted"
      >
        <span>Chargement</span>
        <span className="min-w-[2.5rem] text-right tabular-nums text-neon-blue">
          {progress}%
        </span>
      </motion.div>

      <div className="relative h-1 overflow-hidden rounded-full bg-border/80">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-neon-blue/80 via-neon-blue to-neon-green/70 transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
        <motion.div
          className="absolute inset-y-0 w-20 bg-linear-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '420%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <motion.div
        layout={false}
        className="mt-4 flex justify-center"
      >
        <div className="relative size-7">
          <div className="absolute inset-0 rounded-full border-2 border-neon-blue/12" />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-neon-blue border-r-neon-blue/35"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: 'center' }}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
