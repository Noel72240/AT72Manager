import type { Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { authService } from '@/services/auth/auth.service'
import { withTimeout } from '@/utils/async'
import { profileService } from '@/services/auth/profile.service'
import { sessionIsolationService, sessionService } from '@/services/auth/session.service'
import { securityLogService } from '@/services/audit/security-log.service'
import type { ProfileRecord, WorkshopMember } from '@/types/workshop.types'
import type { AppUser, AuthStatus } from '@/types/user.types'

type AuthStore = {
  status: AuthStatus
  user: AppUser | null
  session: Session | null
  initialized: boolean
  teamMembers: WorkshopMember[]
  activeSessionId: string | null
  previousUserId: string | null
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  loadTeamMembers: () => Promise<void>
  updateMemberRole: (userId: string, role: AppUser['role']) => Promise<void>
}

let unsubscribeAuth: (() => void) | null = null
let initPromise: Promise<void> | null = null

const AUTH_INIT_TIMEOUT_MS = 12_000

function toWorkshopMember(profile: ProfileRecord): WorkshopMember {
  return {
    id: profile.id,
    workshopId: profile.workshopId,
    userId: profile.id,
    email: profile.email || `${profile.id.slice(0, 8)}@atelier.local`,
    fullName: profile.fullName,
    role: profile.role,
    avatarUrl: profile.avatarUrl,
    status: profile.status,
    joinedAt: profile.createdAt,
    lastSeenAt: profile.lastSeenAt,
  }
}

async function afterAuthSuccess(user: AppUser, previousUserId: string | null) {
  if (previousUserId && previousUserId !== user.id) {
    await sessionIsolationService.clearBusinessData()
  }

  const session = await sessionService.start(user.id, user.workshopId)
  await profileService.touchLastSeen(user.id)
  return session.id
}

function setAuthenticated(session: Session, user: AppUser, activeSessionId: string | null) {
  return {
    status: 'authenticated' as const,
    session,
    user,
    activeSessionId,
    previousUserId: user.id,
    initialized: true,
  }
}

function setUnauthenticated() {
  return {
    status: 'unauthenticated' as const,
    user: null,
    session: null,
    teamMembers: [],
    activeSessionId: null,
    initialized: true,
  }
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  status: 'idle',
  user: null,
  session: null,
  initialized: false,
  teamMembers: [],
  activeSessionId: null,
  previousUserId: null,

  initialize: async () => {
    if (get().initialized) return
    if (initPromise) return initPromise

    initPromise = (async () => {
      set({ status: 'loading' })

      if (!authService.isConfigured()) {
        set(setUnauthenticated())
        return
      }

      try {
        const previousUserId = get().previousUserId
        unsubscribeAuth?.()
        unsubscribeAuth = await withTimeout(
          authService.initialize(async (session, user) => {
            if (session && user) {
              const sessionId = await afterAuthSuccess(user, previousUserId)
              set({ ...setAuthenticated(session, user, sessionId) })
              void get().loadTeamMembers()
            } else {
              set(setUnauthenticated())
            }
          }),
          AUTH_INIT_TIMEOUT_MS,
          'Auth init',
        )
      } catch (error) {
        console.error('[auth] Échec initialisation:', error)
        set(setUnauthenticated())
      }
    })()

    try {
      await initPromise
    } finally {
      initPromise = null
    }
  },

  signIn: async (email, password) => {
    set({ status: 'loading' })

    try {
      const previousUserId = get().previousUserId
      const { session, user } = await authService.signIn({ email, password })
      const sessionId = await afterAuthSuccess(user, previousUserId)
      set(setAuthenticated(session, user, sessionId))
      await get().loadTeamMembers()
    } catch (error) {
      set(setUnauthenticated())
      throw error
    }
  },

  signOut: async () => {
    const user = get().user
  const sessionId = get().activeSessionId

    if (sessionId && user?.id) {
      await sessionService.end(user.id)
    }

    await authService.signOut(user)
    await sessionIsolationService.clearBusinessData()
    set({ ...setUnauthenticated(), previousUserId: user?.id ?? null })
  },

  refreshProfile: async () => {
    const { user } = get()
    if (!user) return

    const profile = await profileService.fetchById(user.id, user.email)
    if (!profile) return

    set({
      user: {
        ...user,
        fullName: profile.fullName,
        role: profile.role,
        avatarUrl: profile.avatarUrl,
        workshopId: profile.workshopId,
        lastSeenAt: profile.lastSeenAt,
        status: profile.status,
      },
    })
  },

  loadTeamMembers: async () => {
    const workshopId = get().user?.workshopId
    if (!workshopId) return

    const profiles = await profileService.listWorkshopMembers(workshopId)
    set({ teamMembers: profiles.map(toWorkshopMember) })
  },

  updateMemberRole: async (userId, role) => {
    const { user } = get()
    if (!user?.workshopId) return

    await profileService.updateRole(userId, role)
    await get().loadTeamMembers()

    await securityLogService.log({
      eventType: 'role_changed',
      severity: 'info',
      message: `Rôle modifié → ${role}`,
      userId: user.id,
      workshopId: user.workshopId,
      metadata: { targetUserId: userId, role },
    })
  },
}))

export function getUserInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function formatUserRole(role: AppUser['role']): string {
  const labels: Record<AppUser['role'], string> = {
    admin: 'Administrateur',
    manager: 'Responsable',
    technician: 'Technicien',
    readonly: 'Lecture seule',
  }
  return labels[role]
}
