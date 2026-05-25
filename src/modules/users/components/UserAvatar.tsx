import { cn } from '@/utils/cn'
import { getUserInitials } from '@/store/auth.store'

type UserAvatarProps = {
  name: string
  avatarUrl?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-base',
} as const

export function UserAvatar({ name, avatarUrl, size = 'md', className }: UserAvatarProps) {
  const initials = getUserInitials(name)

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn('rounded-xl object-cover ring-1 ring-neon-blue/25', sizeMap[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl bg-linear-to-br from-neon-blue/30 to-neon-green/20 font-semibold text-neon-blue ring-1 ring-neon-blue/25',
        sizeMap[size],
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  )
}
