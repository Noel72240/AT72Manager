import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PortalApp } from '@/portal/PortalApp'
import '@/styles/globals.css'
import '@/styles/portal-mobile.css'

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML =
    '<p style="color:#e8eaef;padding:24px;font-family:sans-serif">Erreur: #root introuvable</p>'
} else {
  document.getElementById('boot-fallback')?.remove()
  createRoot(rootEl).render(
    <StrictMode>
      <PortalApp />
    </StrictMode>,
  )
}
