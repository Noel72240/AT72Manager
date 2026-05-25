import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { inputVariants } from '@/theme/variants'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  hint?: string
}

export function Textarea({ className, label, error, hint, id, ...props }: TextareaProps) {
  const textareaId = id ?? props.name

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-medium text-text-secondary">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'min-h-[96px] w-full resize-y rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors',
          inputVariants.default,
          error && 'border-danger/40 focus:border-danger/50 focus:ring-danger/15',
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-muted">{hint}</p>
      ) : null}
    </div>
  )
}
