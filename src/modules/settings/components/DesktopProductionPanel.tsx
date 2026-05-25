import { CheckCircle2, Circle, Monitor } from 'lucide-react'
import { env } from '@/config/env'
import { getProductionReadinessChecks } from '@/services/desktop/production-checklist'
import { openLogsFolder } from '@/services/desktop/paths.service'
import { isTauri } from '@tauri-apps/api/core'
import { Button } from '@/components/ui/Button'

export function DesktopProductionPanel() {
  const checks = getProductionReadinessChecks()

  return (
    <section className="rounded-2xl border border-border bg-surface-elevated p-5">
      <div className="mb-4 flex items-center gap-2">
        <Monitor className="size-5 text-neon-blue" />
        <h2 className="text-lg font-semibold text-text-primary">Application desktop</h2>
      </div>
      <p className="mb-4 text-sm text-text-secondary">
        Version {env.appVersion} · environnement <strong>{env.appEnvironment}</strong>
        {env.isDesktopBuild ? ' · build Tauri' : ' · navigateur'}
      </p>
      <ul className="space-y-2">
        {checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-sm">
            {c.ok ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-neon-green" />
            ) : (
              <Circle className="mt-0.5 size-4 shrink-0 text-text-muted" />
            )}
            <span>
              <span className="text-text-primary">{c.label}</span>
              {c.hint && !c.ok ? (
                <span className="block text-xs text-text-muted">{c.hint}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      {isTauri() ? (
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => void openLogsFolder()}
        >
          Ouvrir le dossier des logs
        </Button>
      ) : null}
      <p className="mt-4 text-xs text-text-muted">
        Données locales Windows :{' '}
        <code className="rounded bg-background px-1">%AppData%\com.at72manager.desktop</code>
        . Guide complet : <code>docs/DESKTOP_PRODUCTION.md</code>
      </p>
    </section>
  )
}
