import path from 'node:path'
import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string }
const host = process.env.TAURI_DEV_HOST
const isTauriDebug = Boolean(process.env.TAURI_ENV_DEBUG)

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appVersion = env.VITE_APP_VERSION || pkg.version

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    clearScreen: false,
    server: {
      port: 5173,
      strictPort: false,
      host: host || false,
      hmr: host
        ? {
            protocol: 'ws',
            host,
            port: 1421,
          }
        : undefined,
      watch: {
        ignored: ['**/src-tauri/**'],
      },
    },
    envPrefix: ['VITE_', 'TAURI_'],
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    },
    build: {
      target:
        process.env.TAURI_ENV_PLATFORM === 'windows' || process.platform === 'win32'
          ? 'chrome105'
          : 'safari13',
      minify: isTauriDebug ? false : 'esbuild',
      sourcemap: isTauriDebug,
      cssMinify: !isTauriDebug,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@supabase')) return 'supabase'
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router'))
                return 'vendor-react'
              if (id.includes('framer-motion')) return 'vendor-motion'
              if (id.includes('jspdf') || id.includes('fflate')) return 'vendor-pdf'
            }
          },
        },
      },
    },
  }
})
