import { Card } from '@/components/ui/Card'
import type { BackupSettings, BackupCloudProvider } from '@/services/backup/backup.types'
import { DEFAULT_BACKUP_SETTINGS } from '@/services/backup/backup.types'

type BackupSettingsPanelProps = {
  settings: BackupSettings
  onChange: (settings: BackupSettings) => void
  onSave: () => void
}

const CLOUD_OPTIONS: { value: BackupCloudProvider; label: string; hint: string }[] = [
  { value: 'none', label: 'Local uniquement', hint: 'IndexedDB + fichiers exportés' },
  { value: 'supabase', label: 'Supabase Storage', hint: 'Bucket `backups` (cloud)' },
  { value: 'nextcloud', label: 'Nextcloud', hint: 'Bientôt disponible' },
  { value: 'gdrive', label: 'Google Drive', hint: 'Bientôt disponible' },
  { value: 'nas', label: 'NAS', hint: 'Bientôt disponible' },
]

export function BackupSettingsPanel({ settings, onChange, onSave }: BackupSettingsPanelProps) {
  const s = { ...DEFAULT_BACKUP_SETTINGS, ...settings }

  return (
    <Card title="Paramètres de protection" description="Automatisation, rétention et cloud." animated>
      <div className="space-y-5">
        <label className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-text-primary">Sauvegarde automatique</p>
            <p className="text-xs text-text-muted">Snapshot local + export silencieux (sans téléchargement)</p>
          </div>
          <input
            type="checkbox"
            checked={s.autoBackupEnabled}
            onChange={(e) => onChange({ ...s, autoBackupEnabled: e.target.checked })}
            className="h-5 w-5 rounded border-border"
          />
        </label>

        <div>
          <label className="text-xs font-medium text-text-muted">Intervalle (heures)</label>
          <input
            type="number"
            min={1}
            max={168}
            value={s.autoBackupIntervalHours}
            onChange={(e) =>
              onChange({ ...s, autoBackupIntervalHours: Math.max(1, Number(e.target.value) || 24) })
            }
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted">Snapshots locaux conservés</label>
          <input
            type="number"
            min={3}
            max={30}
            value={s.maxLocalSnapshots}
            onChange={(e) =>
              onChange({ ...s, maxLocalSnapshots: Math.min(30, Math.max(3, Number(e.target.value) || 8)) })
            }
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-4 py-3 opacity-80">
          <div>
            <p className="text-sm font-medium text-text-primary">Chiffrement (futur)</p>
            <p className="text-xs text-text-muted">AES-256 — préparation architecture</p>
          </div>
          <input type="checkbox" disabled checked={s.encryptionEnabled} className="h-5 w-5" />
        </label>

        <label className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-text-primary">Sauvegarde cloud</p>
            <p className="text-xs text-text-muted">Compatible Supabase · extensible NAS / Drive</p>
          </div>
          <input
            type="checkbox"
            checked={s.cloudEnabled}
            onChange={(e) => onChange({ ...s, cloudEnabled: e.target.checked })}
            className="h-5 w-5 rounded border-border"
          />
        </label>

        {s.cloudEnabled && (
          <div className="space-y-2">
            {CLOUD_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 px-3 py-2 has-[:checked]:border-neon-blue/40 has-[:checked]:bg-primary-muted/30"
              >
                <input
                  type="radio"
                  name="cloudProvider"
                  value={opt.value}
                  checked={s.cloudProvider === opt.value}
                  onChange={() => onChange({ ...s, cloudProvider: opt.value })}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-text-muted">{opt.hint}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        {s.lastAutoBackupAt && (
          <p className="text-xs text-text-muted">
            Dernière auto-sauvegarde : {new Date(s.lastAutoBackupAt).toLocaleString('fr-FR')}
          </p>
        )}

        {s.cloudEnabled && s.cloudProvider === 'supabase' && (
          <p className="rounded-lg border border-neon-blue/20 bg-neon-blue/5 px-3 py-2 text-xs text-text-muted">
            Pour voir une sauvegarde dans Supabase : cliquez <strong>Archive ZIP</strong> (ou attendez
            l’auto-sauvegarde). Les entrées « Avant restauration » restent locales uniquement.
          </p>
        )}

        <button
          type="button"
          onClick={onSave}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Enregistrer les paramètres
        </button>
      </div>
    </Card>
  )
}
