import { create } from 'zustand'
import { portalAuthService, PortalAuthError } from '@/services/portal/portal-auth.service'
import type { PortalAuthStatus, PortalClientSession } from '@/types/portal.types'

type PortalAuthStore = {
  status: PortalAuthStatus
  session: PortalClientSession | null
  initialized: boolean
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, accessCode: string) => Promise<void>
  signOut: () => Promise<void>
}

let initPromise: Promise<void> | null = null

export const usePortalAuthStore = create<PortalAuthStore>((set, get) => ({
  status: 'loading',
  session: null,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return

    if (!initPromise) {
      initPromise = (async () => {
        set({ status: 'loading' })
        if (!portalAuthService.isConfigured()) {
          set({ status: 'unauthenticated', session: null, initialized: true })
          return
        }
        try {
          const session = await portalAuthService.initialize()
          if (session) {
            set({ status: 'authenticated', session, initialized: true })
          } else {
            set({ status: 'unauthenticated', session: null, initialized: true })
          }
        } catch {
          set({ status: 'unauthenticated', session: null, initialized: true })
        }
      })()
    }

    await initPromise
  },

  signIn: async (email, password) => {
    set({ status: 'loading' })
    try {
      const session = await portalAuthService.signIn(email, password)
      set({ status: 'authenticated', session, initialized: true })
    } catch (error) {
      set({ status: 'unauthenticated', session: null })
      throw error instanceof PortalAuthError ? error : new PortalAuthError('Connexion impossible.')
    }
  },

  signUp: async (email, password, accessCode) => {
    set({ status: 'loading' })
    try {
      const session = await portalAuthService.signUp({ email, password, accessCode })
      set({ status: 'authenticated', session, initialized: true })
    } catch (error) {
      set({ status: 'unauthenticated', session: null })
      throw error instanceof PortalAuthError ? error : new PortalAuthError('Inscription impossible.')
    }
  },

  signOut: async () => {
    await portalAuthService.signOut()
    set({ status: 'unauthenticated', session: null, initialized: true })
  },
}))
