import { Component, type ErrorInfo, type ReactNode } from 'react'
import { env } from '@/config/env'

type Props = { children: ReactNode }
type State = { error: Error | null }

/** Error boundary portail web — sans recovery IndexedDB atelier. */
export class PortalRootErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PortalErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: '#0a0c12',
            color: '#e8eaef',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>Portail client — erreur</h1>
          <p style={{ fontSize: 14, color: '#8b92a8', maxWidth: 420, textAlign: 'center' }}>
            {this.state.error.message}
          </p>
          <button
            type="button"
            style={{
              marginTop: 20,
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#00cfff',
              color: '#0a0c12',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={() => window.location.reload()}
          >
            Recharger
          </button>
          <p style={{ marginTop: 16, fontSize: 11, color: '#5c6378' }}>
            v{env.appVersion} · portail web
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
