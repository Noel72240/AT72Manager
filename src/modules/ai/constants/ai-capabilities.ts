import type { AiCapability } from '@/services/ai/types'
import {
  BarChart3,
  ClipboardList,
  FileText,
  MessageSquare,
  NotebookPen,
  Receipt,
  ScanSearch,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const AI_CAPABILITY_LABELS: Record<AiCapability, string> = {
  chat: 'Question SAV',
  diagnose: 'Analyser panne',
  generate_diagnostic: 'Texte diagnostic',
  generate_technician_notes: 'Notes technicien',
  generate_intervention_summary: 'Résumé intervention',
  generate_quote_text: 'Texte devis',
  generate_sav_report: 'Rapport SAV',
  analyze_trends: 'Tendances atelier',
}

export const AI_CAPABILITY_USER_PROMPTS: Partial<Record<AiCapability, string>> = {
  diagnose: 'Lance une analyse complète de la panne en cours.',
  generate_diagnostic: 'Génère le texte de diagnostic atelier pour ce dossier.',
  generate_technician_notes: 'Génère les notes technicien structurées.',
  generate_intervention_summary: 'Génère un résumé d\'intervention client et interne.',
  generate_quote_text: 'Génère le texte descriptif pour le devis SAV.',
  generate_sav_report: 'Génère le rapport SAV complet.',
  analyze_trends: 'Analyse les tendances et l\'historique atelier.',
}

export type AiQuickAction = {
  capability: AiCapability
  label: string
  description: string
  icon: LucideIcon
}

export const AI_QUICK_ACTIONS: AiQuickAction[] = [
  {
    capability: 'diagnose',
    label: 'Analyser panne',
    description: 'Causes probables & composants suspects',
    icon: ScanSearch,
  },
  {
    capability: 'generate_diagnostic',
    label: 'Texte diagnostic',
    description: 'Rédaction diagnostic atelier',
    icon: Sparkles,
  },
  {
    capability: 'generate_technician_notes',
    label: 'Notes technicien',
    description: 'Compte-rendu technique',
    icon: NotebookPen,
  },
  {
    capability: 'generate_intervention_summary',
    label: 'Résumé intervention',
    description: 'Synthèse client / dossier',
    icon: ClipboardList,
  },
  {
    capability: 'generate_quote_text',
    label: 'Texte devis',
    description: 'Description commerciale SAV',
    icon: Receipt,
  },
  {
    capability: 'generate_sav_report',
    label: 'Rapport SAV',
    description: 'Document complet restitution',
    icon: FileText,
  },
  {
    capability: 'analyze_trends',
    label: 'Tendances atelier',
    description: 'Pannes & pièces récurrentes',
    icon: BarChart3,
  },
]

export const AI_CHAT_ACTION: AiQuickAction = {
  capability: 'chat',
  label: 'Discussion libre',
  description: 'Posez une question à l\'assistant',
  icon: MessageSquare,
}
