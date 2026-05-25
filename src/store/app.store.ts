import { create } from 'zustand'
import type { ThemeMode } from '@/theme'

type AppState = {
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
}

export const useAppStore = create<AppState>((set) => ({
  themeMode: 'dark',
  setThemeMode: (themeMode) => set({ themeMode }),
}))
