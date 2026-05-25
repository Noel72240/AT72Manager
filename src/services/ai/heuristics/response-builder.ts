import type { AiCapability, AiCompletionRequest } from '@/services/ai/types'
import type { SavAnalysisInput, SavHeuristicAnalysis } from '@/services/ai/heuristics/sav-types'
import { SAV_DEVICE_LABELS } from '@/services/ai/heuristics/sav-types'
import { getDeviceProfile } from '@/services/ai/heuristics/sav-device-profiles'
import { normalizeHeuristicText } from '@/services/ai/heuristics/text-normalizer'
import {
  buildConversationalIntro,
  buildWorkshopClosing,
} from '@/services/ai/heuristics/response-generator'

function formatList(title: string, items: string[], ordered = false): string {
  if (items.length === 0) return `### ${title}\n_Compléter après tests atelier._`
  const body = ordered
    ? items.map((item, i) => `${i + 1}. ${item}`).join('\n')
    : items.map((item) => `- ${item}`).join('\n')
  return `### ${title}\n${body}`
}

function urgencyLabel(urgency: SavHeuristicAnalysis['urgency']): string {
  const map = { basse: '🟢 Basse', moyenne: '🟡 Moyenne', haute: '🟠 Haute', critique: '🔴 Critique' }
  return map[urgency]
}

function headerBlock(input: SavAnalysisInput, analysis: SavHeuristicAnalysis): string {
  const catLabel = SAV_DEVICE_LABELS[analysis.deviceCategory]
  const lines = [
    analysis.expertSummary,
    '',
    `**Type détecté :** ${catLabel} — ${analysis.detectedDeviceLabel}`,
    `**Confiance :** ${analysis.confidencePercent} % (${analysis.confidence}) · **Urgence :** ${urgencyLabel(analysis.urgency)}`,
    input.clientName ? `**Client :** ${input.clientName}` : '',
    `**Panne :** ${analysis.issue}`,
  ]
  return lines.filter(Boolean).join('\n')
}

export function buildDiagnoseResponse(input: SavAnalysisInput, analysis: SavHeuristicAnalysis): string {
  const profile = getDeviceProfile(analysis.deviceCategory)
  const probLines =
    analysis.matchedSymptoms.length > 0
      ? analysis.matchedSymptoms
          .slice(0, 4)
          .map((m) => `- **${m.rule.label}** — ${m.probability ?? 0} % probabilité`)
          .join('\n')
      : '_Symptôme à affiner_'
  return [
    '## Diagnostic SAV — moteur expert AT72 v3',
    '',
    headerBlock(input, analysis),
    '',
    profile?.expertNote ? `> 💡 ${profile.expertNote}` : '',
    '',
    '### Symptômes identifiés',
    probLines,
    '',
    formatList('Causes probables', analysis.probableCauses, true),
    '',
    formatList('Composants suspects', analysis.suspectComponents),
    '',
    formatList('Procédures de test', analysis.testProcedures, true),
    '',
    formatList('Recommandations atelier', analysis.recommendations),
    '',
    analysis.solutions.length ? formatList('Solutions possibles', analysis.solutions) : '',
    '',
    '### Texte diagnostic proposé',
    `« ${analysis.diagnosticText} »`,
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildTechnicianNotes(input: SavAnalysisInput, analysis: SavHeuristicAnalysis): string {
  const now = new Date().toLocaleString('fr-FR')
  return [
    '## Notes technicien',
    '',
    `**${now}** · ${input.clientName ?? 'Client'} · ${analysis.detectedDeviceLabel}`,
    '',
    '**Réception**',
    `- Symptôme : ${analysis.issue}`,
    `- Profil : ${SAV_DEVICE_LABELS[analysis.deviceCategory]} (confiance ${analysis.confidencePercent} %)`,
    `- Piste principale : ${analysis.matchedSymptoms[0]?.rule.label ?? 'diagnostic en cours'}`,
    '',
    '**Plan de test**',
    ...analysis.testProcedures.slice(0, 5).map((t) => `- ${t}`),
    '',
    '**Composants sous surveillance**',
    `- ${analysis.suspectComponents.slice(0, 5).join(', ') || 'à déterminer'}`,
    input.existingDiagnostic ? `- Diagnostic existant : ${input.existingDiagnostic}` : '',
    '',
    '**Suite** : validation pièces → devis → contrôle qualité restitution.',
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildDiagnosticText(_input: SavAnalysisInput, analysis: SavHeuristicAnalysis): string {
  return [
    '## Texte diagnostic atelier',
    '',
    analysis.diagnosticText,
    '',
    '**Contrôles prévus :**',
    ...analysis.testProcedures.slice(0, 3).map((t) => `- ${t}`),
    '',
    '**Hypothèse retenue :**',
    analysis.probableCauses[0] ?? 'À confirmer après tests.',
  ].join('\n')
}

export function buildInterventionSummary(input: SavAnalysisInput, analysis: SavHeuristicAnalysis): string {
  return [
    '## Résumé intervention',
    '',
    `Intervention **${input.clientName ?? 'client'}** — ${analysis.detectedDeviceLabel} (${SAV_DEVICE_LABELS[analysis.deviceCategory]}).`,
    '',
    `**Motif :** ${analysis.issue}`,
    '',
    analysis.expertSummary,
    '',
    '**Travaux prévus :**',
    `- Diagnostic ${analysis.matchedSymptoms[0]?.rule.label.toLowerCase() ?? 'complet'}`,
    `- Pièces probables : ${analysis.suspectComponents.slice(0, 3).join(', ') || 'après validation'}`,
    '- Contrôle qualité avant restitution.',
  ].join('\n')
}

export function buildQuoteText(input: SavAnalysisInput, analysis: SavHeuristicAnalysis): string {
  const parts = analysis.suspectComponents.slice(0, 3).join(', ') || 'pièces à confirmer'
  return [
    '## Texte devis SAV',
    '',
    `**Client :** ${input.clientName ?? 'Client atelier'}`,
    `**Appareil :** ${analysis.detectedDeviceLabel}`,
    '',
    `**Panne signalée :** ${analysis.issue}`,
    '',
    '**Prestations :**',
    '- Diagnostic atelier complet',
    '- Main-d\'œuvre qualifiée',
    `- Fourniture : ${parts}`,
    '- Tests fonctionnels et contrôle qualité',
    '',
    '**Conditions :** devis 30 jours · délai selon disponibilité pièces · garantie atelier.',
  ].join('\n')
}

export function buildSavReport(input: SavAnalysisInput, analysis: SavHeuristicAnalysis): string {
  return [
    '# Rapport SAV AT72Manager',
    '',
    headerBlock(input, analysis),
    '',
    '## Constat réception',
    `Le client signale : ${analysis.issue}.`,
    input.historySummary ? `\n**Historique :**\n${input.historySummary}` : '',
    '',
    formatList('Analyse — causes probables', analysis.probableCauses, true),
    '',
    formatList('Composants concernés', analysis.suspectComponents),
    '',
    formatList('Tests réalisés / planifiés', analysis.testProcedures, true),
    '',
    formatList('Recommandations', analysis.recommendations),
    '',
    '## Conclusion',
    analysis.diagnosticText,
    '',
    '_Rapport généré par le moteur expert local — validation technicien requise._',
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildTrendsAnalysis(input: SavAnalysisInput): string {
  const trends = input.trendsSummary ?? 'Données atelier insuffisantes.'
  return [
    '## Tendances SAV atelier',
    '',
    trends,
    '',
    '### Actions recommandées',
    '- Anticiper stock pièces récurrentes',
    '- Fiches réflexes sur pannes fréquentes',
    '- Ajuster délais diagnostic selon charge',
  ].join('\n')
}

export function buildChatResponse(
  input: SavAnalysisInput,
  analysis: SavHeuristicAnalysis,
  request: AiCompletionRequest,
): string {
  const q = normalizeHeuristicText(input.userMessage)
  const isDiagnose = /diagnostic|panne|cause|composant|suspect|repar|allume|demarre|charge|ecran/i.test(q)
  const isQuote = /devis|prix|tarif|factur/i.test(q)
  const isTest = /test|procedure|verifier|controle|comment/i.test(q)

  const lines = [
    '## Copilote SAV AT72 · expert local v3',
    '',
    buildConversationalIntro(input, analysis),
    '',
    headerBlock(input, analysis),
  ]

  if (isDiagnose || analysis.matchedSymptoms.length > 0) {
    const top = analysis.matchedSymptoms[0]
    lines.push(
      '',
      top
        ? `En atelier, je commencerais par creuser **${top.rule.label.toLowerCase()}** (${top.probability ?? 0} % de correspondance).`
        : 'Voici mon analyse technique :',
      '',
      formatList('Causes probables', analysis.probableCauses.slice(0, 4), true),
      '',
      formatList('À contrôler en priorité', analysis.suspectComponents.slice(0, 5)),
    )
    if (analysis.solutions.length) {
      lines.push('', formatList('Pistes de réparation', analysis.solutions.slice(0, 4)))
    }
  }

  if (isTest) {
    lines.push('', formatList('Tests conseillés', analysis.testProcedures.slice(0, 5), true))
  }

  if (isQuote) {
    lines.push(
      '',
      `Pour le devis, je orienterais vers : **${analysis.suspectComponents.slice(0, 3).join(', ') || 'diagnostic préalable'}**.`,
      'Utilisez l\'action **Texte devis** pour un modèle complet.',
    )
  }

  if (!isDiagnose && !isQuote && !isTest && analysis.matchedSymptoms.length === 0) {
    lines.push(
      '',
      'Décrivez la panne avec le type d\'appareil (ex. *« PC gaming ne s\'allume plus »*) ou utilisez **Analyser panne**.',
    )
  }

  const histCount = request.history?.filter((m) => m.role === 'assistant').length ?? 0
  if (histCount > 0) {
    lines.push('', '_Réponse enrichie par l\'historique de la conversation._')
  }

  lines.push('', buildWorkshopClosing(analysis))

  return lines.join('\n')
}

export function buildCapabilityResponse(
  capability: AiCapability,
  input: SavAnalysisInput,
  analysis: SavHeuristicAnalysis,
  request: AiCompletionRequest,
): string {
  const map = {
    chat: () => buildChatResponse(input, analysis, request),
    diagnose: () => buildDiagnoseResponse(input, analysis),
    generate_diagnostic: () => buildDiagnosticText(input, analysis),
    generate_technician_notes: () => buildTechnicianNotes(input, analysis),
    generate_intervention_summary: () => buildInterventionSummary(input, analysis),
    generate_quote_text: () => buildQuoteText(input, analysis),
    generate_sav_report: () => buildSavReport(input, analysis),
    analyze_trends: () => buildTrendsAnalysis(input),
  }
  return map[capability]()
}
