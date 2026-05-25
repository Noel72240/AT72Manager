import type { AiCapability } from '@/services/ai/types'
import { formatSavContextBlock } from '@/services/ai/context/sav-context.format'

const BASE_SYSTEM = `Tu es l'assistant IA professionnel intégré à AT72Manager, logiciel de gestion SAV pour réparation d'appareils électroniques (smartphones, tablettes, ordinateurs).
Réponds en français, ton expert atelier, concis et actionnable.
Structure tes réponses avec des listes quand pertinent.
Ne invente pas de références pièces inexistantes : si incertain, indique-le.
Respecte le RGPD : ne redemande pas de données inutiles.`

export function buildSystemPrompt(capability: AiCapability, contextBlock: string): string {
  const ctx = contextBlock ? `\n\n--- CONTEXTE MÉTIER ---\n${contextBlock}` : ''

  const instructions: Record<AiCapability, string> = {
    chat: `${BASE_SYSTEM}
Aide le technicien : diagnostic, organisation, relation client, devis, pièces.`,
    diagnose: `${BASE_SYSTEM}
Analyse la panne signalée. Fournis :
1) Causes probables (3-5)
2) Composants suspects
3) Recommandations SAV (tests, outils, délais)
4) Proposition de texte diagnostic atelier
Sois prudent sur les certitudes.`,
    generate_diagnostic: `${BASE_SYSTEM}
Rédige un diagnostic atelier professionnel (3-6 phrases) basé sur les faits connus.`,
    generate_technician_notes: `${BASE_SYSTEM}
Rédige des notes technicien claires pour le dossier (puces ou paragraphes courts).`,
    generate_intervention_summary: `${BASE_SYSTEM}
Rédige un résumé d'intervention pour le client et l'archivage interne (ton professionnel).`,
    generate_quote_text: `${BASE_SYSTEM}
Rédige le texte d'introduction et la description des prestations pour un devis SAV (sans montants inventés).`,
    generate_sav_report: `${BASE_SYSTEM}
Rédige un rapport SAV structuré : contexte, constat, actions, recommandations, conclusion.`,
    analyze_trends: `${BASE_SYSTEM}
Analyse les tendances SAV fournies et donne des insights actionnables pour l'atelier.`,
  }

  return `${instructions[capability]}${ctx}`
}

export function buildUserPrompt(capability: AiCapability, userMessage: string): string {
  if (capability === 'analyze_trends' && !userMessage.trim()) {
    return 'Analyse les tendances et l\'historique fournis dans le contexte.'
  }
  return userMessage.trim() || 'Analyse le contexte et propose une aide adaptée.'
}

export function buildMessagesForCapability(
  capability: AiCapability,
  userMessage: string,
  contextBlock: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
) {
  const system = buildSystemPrompt(capability, contextBlock)
  const user = buildUserPrompt(capability, userMessage)
  return [
    { role: 'system' as const, content: system },
    ...history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: user },
  ]
}

export function formatContextForPrompt(context?: Parameters<typeof formatSavContextBlock>[0]): string {
  return formatSavContextBlock(context)
}
