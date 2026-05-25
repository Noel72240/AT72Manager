import type { Session } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'manager' | 'technician' | 'readonly'

export type AppUser = {
  id: string
  email: string
  fullName: string
  role: UserRole
  avatarUrl?: string
  workshopId?: string
  lastSeenAt?: string
  status?: 'active' | 'inactive' | 'invited'
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

export type AuthState = {
  status: AuthStatus
  user: AppUser | null
  session: Session | null
  initialized: boolean
}

export type SignInCredentials = {
  email: string
  password: string
}
