import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { inputVariants } from '@/theme/variants'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
}

export function Input({ className, label, error, hint, id, ...props }: InputProps) {
  const inputId = id ?? props.name

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'h-10 w-full rounded-xl px-3.5 text-sm outline-none transition-colors',
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
