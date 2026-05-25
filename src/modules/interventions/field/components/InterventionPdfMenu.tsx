import { useState } from 'react'
import { FileDown, FileText } from 'lucide-react'
import type { Client } from '@/types/entities'
import type { InterventionPdfKind } from '@/modules/interventions/field/types/field.types'
import { PDF_KIND_LABELS } from '@/modules/interventions/field/types/field.types'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

type InterventionPdfMenuProps = {
  client?: Client
  isExporting: boolean
  onExport: (kind: InterventionPdfKind) => void
}

export function InterventionPdfMenu({ client, isExporting, onExport }: InterventionPdfMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        aria-label="Exporter PDF"
        loading={isExporting}
        disabled={!client}
        onClick={() => setOpen((value) => !value)}
      >
        <FileDown className="size-4" />
      </Button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              'absolute right-0 z-50 mt-1 min-w-[200px] rounded-xl border border-border/80',
              'bg-surface-elevated p-1 shadow-card',
            )}
          >
            {(['work_order', 'sav_report'] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                onClick={() => {
                  setOpen(false)
                  onExport(kind)
                }}
              >
                <FileText className="size-4 shrink-0 text-neon-blue" />
                {PDF_KIND_LABELS[kind]}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
