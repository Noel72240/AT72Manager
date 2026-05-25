import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export type Toast = {
  id: string
  variant: ToastVariant
  title: string
  message?: string
  duration: number
}

type ToastInput = {
  variant: ToastVariant
  title: string
  message?: string
  duration?: number
}

type ToastStore = {
  toasts: Toast[]
  push: (toast: ToastInput) => string
  dismiss: (id: string) => void
  clear: () => void
}

const DEFAULT_DURATION = 4500

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  push: (toast) => {
    const id = crypto.randomUUID()
    const duration = toast.duration ?? DEFAULT_DURATION
    const item: Toast = { ...toast, id, duration }

    set({ toasts: [...get().toasts, item] })

    window.setTimeout(() => {
      get().dismiss(id)
    }, duration)

    return id
  },

  dismiss: (id) =>
    set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),

  clear: () => set({ toasts: [] }),
}))

export const toast = {
  success(title: string, message?: string) {
    return useToastStore.getState().push({ variant: 'success', title, message })
  },
  error(title: string, message?: string) {
    return useToastStore.getState().push({ variant: 'error', title, message })
  },
  info(title: string, message?: string) {
    return useToastStore.getState().push({ variant: 'info', title, message })
  },
  warning(title: string, message?: string) {
    return useToastStore.getState().push({ variant: 'warning', title, message })
  },
}
