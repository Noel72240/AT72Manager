import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { buttonSizes, buttonVariants, type ButtonSize, type ButtonVariant } from '@/theme/variants'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  )
}
