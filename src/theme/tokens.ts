export const themeTokens = {
  colors: {
    background: '#0d0f1b',
    surface: '#13151f',
    surfaceElevated: '#1a1d2e',
    neonBlue: '#00cfff',
    neonGreen: '#00ff94',
    textPrimary: '#f0f2f8',
    textSecondary: '#9499b0',
    textMuted: '#5c6178',
    danger: '#ff6b6b',
    warning: '#ffb84d',
  },
  radius: {
    sm: '0.375rem',
    md: '0.625rem',
    lg: '0.875rem',
    xl: '1rem',
  },
  spacing: {
    page: '1.5rem',
    pageLg: '2rem',
    section: '2rem',
  },
} as const

export type ThemeMode = 'dark'

export const defaultThemeMode: ThemeMode = 'dark'
