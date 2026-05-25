import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useToastStore, type Toast, type ToastVariant } from '@/store/toast.store'

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-neon-green/25 bg-accent-muted/80 text-neon-green',
  error: 'border-danger/25 bg-danger/10 text-danger',
  info: 'border-neon-blue/25 bg-primary-muted/80 text-neon-blue',
  warning: 'border-warning/25 bg-warning/10 text-warning',
}

const icons: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((state) => state.dismiss)
  const Icon = icons[toast.variant]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-card glass-elevated',
        variantStyles[toast.variant],
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-xs text-text-secondary">{toast.message}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
        aria-label="Fermer la notification"
      >
        <X className="size-3.5" />
      </button>
    </motion.div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)

  return (
    <motion.div
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
