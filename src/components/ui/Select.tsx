import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'
import { inputVariants } from '@/theme/variants'

export type SelectOption<T extends string = string> = {
  value: T
  label: string
}

type SelectProps<T extends string = string> = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
  options: SelectOption<T>[]
}

export function Select<T extends string = string>({
  className,
  label,
  error,
  options,
  id,
  ...props
}: SelectProps<T>) {
  const selectId = id ?? props.name

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            'h-10 w-full appearance-none rounded-xl px-3.5 pr-9 text-sm outline-none transition-colors',
            inputVariants.default,
            error && 'border-danger/40 focus:border-danger/50 focus:ring-danger/15',
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
