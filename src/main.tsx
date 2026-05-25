import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RootErrorBoundary } from '@/components/ui/RootErrorBoundary'
import { initAppRuntime } from '@/services/desktop/app-runtime.service'
import App from '@/app/App'
import '@/styles/globals.css'

void initAppRuntime()

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML =
    '<p style="color:white;padding:24px;font-family:sans-serif">Erreur: élément #root introuvable</p>'
} else {
  document.getElementById('boot-fallback')?.remove()

  createRoot(rootEl).render(
    <StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </StrictMode>,
  )
}
