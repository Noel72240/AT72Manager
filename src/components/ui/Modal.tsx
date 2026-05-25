import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
  className?: string
}

const sizeStyles = { md: 'max-w-lg', lg: 'max-w-2xl' }

export function Modal({ open, onClose, title, description, children, footer, size = 'md', className }: ModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button type="button" aria-label="Fermer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div role="dialog" aria-modal="true" aria-labelledby="modal-title" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ type: 'spring', stiffness: 420, damping: 32 }} className={cn('relative z-10 w-full rounded-2xl border border-border bg-surface-elevated shadow-card glass-elevated', sizeStyles[size], className)}>
            <div className="flex items-start justify-between border-b border-border px-6 py-5">
              <div>
                <h2 id="modal-title" className="text-lg font-semibold text-text-primary">{title}</h2>
                {description ? <p className="mt-1 text-sm text-text-muted">{description}</p> : null}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fermer"><X className="size-4" /></Button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
            {footer ? <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">{footer}</div> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
