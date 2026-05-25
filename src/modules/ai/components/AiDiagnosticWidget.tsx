import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  ClipboardCopy,
  Loader2,
  ScanSearch,
  Sparkles,
  Wand2,
} from 'lucide-react'
import type { InterventionFormValues } from '@/modules/interventions/types/intervention-module.types'
import type { Intervention } from '@/types/entities'
import { useAiAssistant } from '@/modules/ai/hooks/useAiAssistant'
import { useAiStore } from '@/store/ai.store'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { toast } from '@/store/toast.store'
import { cn } from '@/utils/cn'

type AiDiagnosticWidgetProps = {
  values: InterventionFormValues
  intervention?: Intervention | null
  disabled?: boolean
  onApplyField?: (field: 'diagnostic' | 'technicianNotes', value: string) => void
}

function extractSection(content: string, heading: string): string | null {
  const regex = new RegExp(`###?\\s*${heading}[\\s\\S]*?(?=###|$)`, 'i')
  const match = content.match(regex)
  if (!match) return null
  return match[0].replace(/^###?\s*[^\n]+\n?/i, '').trim()
}

export function AiDiagnosticWidget({
  values,
  intervention,
  disabled,
  onApplyField,
}: AiDiagnosticWidgetProps) {
  const { userId, isAiEnabled, bindInterventionForm } = useAiAssistant()
  const runQuickAction = useAiStore((state) => state.runQuickAction)
  const setPanelOpen = useAiStore((state) => state.setPanelOpen)
  const sending = useAiStore((state) => state.sending)

  const [lastResult, setLastResult] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  async function runDiagnose() {
    if (!userId || !values.reportedIssue.trim()) {
      toast.info('Panne requise', 'Renseignez la panne signalée pour lancer l\'analyse.')
      return
    }
    bindInterventionForm(values, intervention)
    const result = await runQuickAction(userId, 'diagnose')
    if (result) {
      setLastResult(result)
      setExpanded(true)
    }
  }

  function applyDiagnosticText() {
    if (!lastResult || !onApplyField) return
    const diagnostic =
      extractSection(lastResult, 'Proposition diagnostic atelier') ??
      extractSection(lastResult, 'Diagnostic') ??
      lastResult.slice(0, 500)
    onApplyField('diagnostic', diagnostic.replace(/^["«]|["»]$/g, '').trim())
    toast.success('Diagnostic appliqué', 'Texte inséré dans le formulaire.')
  }

  function openAssistant() {
    bindInterventionForm(values, intervention)
    setPanelOpen(true)
  }

  const causes = lastResult ? extractSection(lastResult, 'Causes probables') : null
  const components = lastResult ? extractSection(lastResult, 'Composants suspects') : null

  return (
    <motion.div
      layout
      className={cn(
        'overflow-hidden rounded-xl border border-neon-blue/20',
        'bg-linear-to-br from-neon-blue/8 via-surface-elevated/40 to-neon-green/5',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="flex items-start gap-3">
          <motion.div
            animate={{ boxShadow: ['0 0 0 rgba(56,189,248,0)', '0 0 24px rgba(56,189,248,0.2)', '0 0 0 rgba(56,189,248,0)'] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="flex size-10 items-center justify-center rounded-xl bg-neon-blue/15 text-neon-blue ring-1 ring-neon-blue/25"
          >
            <ScanSearch className="size-5" />
          </motion.div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-text-primary">Assistant diagnostic IA</h4>
              <Badge variant="primary">SAV Pro</Badge>
            </div>
            <p className="mt-1 max-w-md text-xs text-text-muted">
              Analyse panne, causes probables, composants suspects et recommandations atelier.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled || !isAiEnabled || sending}
            onClick={() => void runDiagnose()}
            className="gap-1.5"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            Analyser
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={openAssistant}>
            <Sparkles className="size-4" />
            Chat IA
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && lastResult ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-neon-blue/10 px-4 pb-4"
          >
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {causes ? (
                <motion.div className="rounded-lg border border-border/60 bg-background/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-neon-blue">
                    Causes probables
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-xs text-text-secondary">{causes}</p>
                </motion.div>
              ) : null}
              {components ? (
                <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-neon-green">
                    Composants suspects
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-xs text-text-secondary">{components}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {onApplyField ? (
                <Button type="button" size="sm" variant="primary" onClick={applyDiagnosticText}>
                  <ArrowRight className="size-4" />
                  Appliquer au diagnostic
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  void navigator.clipboard.writeText(lastResult)
                  toast.success('Copié', 'Analyse copiée dans le presse-papiers.')
                }}
              >
                <ClipboardCopy className="size-4" />
                Copier
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}
