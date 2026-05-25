import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Archive, FileJson, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  ALL_BACKUP_ENTITY_KEYS,
  BACKUP_ENTITY_LABELS,
  type BackupEntityKey,
} from '@/services/backup/backup.types'

type BackupActionsPanelProps = {
  exporting: boolean
  restoring: boolean
  onExportJson: () => void
  onExportZip: () => void
  onImport: (file: File, entities?: BackupEntityKey[]) => void
}

export function BackupActionsPanel({
  exporting,
  restoring,
  onExportJson,
  onExportZip,
  onImport,
}: BackupActionsPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectiveOpen, setSelectiveOpen] = useState(false)
  const [selected, setSelected] = useState<BackupEntityKey[]>([...ALL_BACKUP_ENTITY_KEYS])

  function toggleEntity(key: BackupEntityKey) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  function handleFileChange(file: File | undefined) {
    if (!file) return
    if (selectiveOpen && selected.length < ALL_BACKUP_ENTITY_KEYS.length) {
      onImport(file, selected)
      setSelectiveOpen(false)
    } else {
      onImport(file)
    }
  }

  return (
    <Card
      title="Actions de sauvegarde"
      description="Exportez, importez ou restaurez sélectivement vos données atelier."
      animated
      hover
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Button
          variant="secondary"
          loading={exporting}
          leftIcon={<FileJson className="h-4 w-4" />}
          onClick={onExportJson}
          className="h-auto flex-col gap-2 py-4"
        >
          <span>Export JSON</span>
          <span className="text-xs font-normal opacity-70">Lecture & audit</span>
        </Button>
        <Button
          variant="primary"
          loading={exporting}
          leftIcon={<Archive className="h-4 w-4" />}
          onClick={onExportZip}
          className="h-auto flex-col gap-2 py-4"
        >
          <span>Archive ZIP</span>
          <span className="text-xs font-normal opacity-70">Compression intelligente</span>
        </Button>
        <Button
          variant="secondary"
          loading={restoring}
          leftIcon={<Upload className="h-4 w-4" />}
          onClick={() => fileRef.current?.click()}
          className="h-auto flex-col gap-2 py-4"
        >
          <span>Importer / Restaurer</span>
          <span className="text-xs font-normal opacity-70">JSON ou ZIP</span>
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".json,.zip,application/json,application/zip"
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files?.[0])}
      />

      <div className="mt-6 border-t border-border/60 pt-4">
        <button
          type="button"
          onClick={() => setSelectiveOpen((v) => !v)}
          className="text-sm font-medium text-neon-blue hover:underline"
        >
          {selectiveOpen ? 'Masquer' : 'Afficher'} la restauration sélective
        </button>

        {selectiveOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 space-y-3"
          >
            <p className="text-xs text-text-muted">
              Choisissez les sections à restaurer, puis importez un fichier compatible.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ALL_BACKUP_ENTITY_KEYS.map((key) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm transition hover:border-neon-blue/30"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(key)}
                    onChange={() => toggleEntity(key)}
                    className="rounded border-border"
                  />
                  {BACKUP_ENTITY_LABELS[key]}
                </label>
              ))}
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={selected.length === 0 || restoring}
              onClick={() => fileRef.current?.click()}
            >
              Importer sélection ({selected.length})
            </Button>
          </motion.div>
        )}
      </div>
    </Card>
  )
}
