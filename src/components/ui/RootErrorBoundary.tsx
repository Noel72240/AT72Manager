import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportReactError } from '@/services/desktop/crash-report.service'
import { getRecoveryState, runRecoveryAction } from '@/services/desktop/recovery.service'
import { env } from '@/config/env'

type Props = { children: ReactNode }
type State = { error: Error | null; reporting: boolean }

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null, reporting: false }

  static getDerivedStateFromError(error: Error): State {
    return { error, reporting: false }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[RootErrorBoundary]', error, info)
    this.setState({ reporting: true })
    void reportReactError(error, info.componentStack ?? undefined).finally(() => {
      this.setState({ reporting: false })
    })
  }

  render() {
    if (this.state.error) {
      const recovery = getRecoveryState()
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
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>AT72Manager — erreur</h1>
          <p style={{ fontSize: 12, color: '#8b92a8', marginBottom: 16 }}>
            v{env.appVersion} · {env.appEnvironment}
            {this.state.reporting ? ' · rapport en cours…' : ''}
          </p>
          <p style={{ fontSize: 14, color: '#8b92a8', maxWidth: 520, textAlign: 'center' }}>
            {this.state.error.message}
          </p>
          <p style={{ fontSize: 12, color: '#5c6378', marginTop: 8, maxWidth: 480, textAlign: 'center' }}>
            Base locale : {recovery.dbStatus ?? 'inconnue'}
            {recovery.isTauri ? ' · logs dans le dossier application' : ''}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24, justifyContent: 'center' }}>
            <button
              type="button"
              style={btnStyle('#00cfff', '#0a0c12')}
              onClick={() => void runRecoveryAction('reload')}
            >
              Recharger
            </button>
            <button
              type="button"
              style={btnStyle('#1a2332', '#e8eaef')}
              onClick={() => void runRecoveryAction('reinit_db')}
            >
              Réinitialiser la base locale
            </button>
            {recovery.isTauri ? (
              <button
                type="button"
                style={btnStyle('#1a2332', '#e8eaef')}
                onClick={() => void runRecoveryAction('open_logs')}
              >
                Ouvrir les logs
              </button>
            ) : null}
            <button
              type="button"
              style={btnStyle('#1a2332', '#e8eaef')}
              onClick={() => void runRecoveryAction('clear_auth')}
            >
              Réinitialiser la session
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    background: bg,
    color,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
  }
}
