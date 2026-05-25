import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { ROUTES } from '@/config/routes'
import { Button } from '@/components/ui/Button'

type ErrorBoundaryProps = {
  children: ReactNode
  title?: string
}

type ErrorBoundaryState = {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 p-8 text-center">
          <div
            className="flex size-14 items-center justify-center rounded-xl bg-danger/10 text-danger ring-1 ring-danger/20"
            aria-hidden
          >
            <AlertTriangle className="size-7" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {this.props.title ?? 'Une erreur est survenue'}
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              {this.state.error.message || 'Impossible d’afficher cette page.'}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => this.setState({ error: null })}>
              Réessayer
            </Button>
            <Link to={ROUTES.DASHBOARD}>
              <Button>Retour au tableau de bord</Button>
            </Link>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
