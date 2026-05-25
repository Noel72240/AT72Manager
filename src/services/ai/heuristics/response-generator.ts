import type { SavAnalysisInput, SavHeuristicAnalysis } from '@/services/ai/heuristics/sav-types'
import { SAV_DEVICE_LABELS } from '@/services/ai/heuristics/sav-types'

function urgencyIntro(urgency: SavHeuristicAnalysis['urgency']): string {
  switch (urgency) {
    case 'critique':
      return '⚠️ **Attention** — cette panne peut présenter un risque sécurité (chaleur, gonflement, odeur). Traitez-la en priorité.'
    case 'haute':
      return 'Je recommande de planifier le diagnostic rapidement — la panne semble bloquante pour le client.'
    case 'moyenne':
      return 'On a une piste claire ; quelques tests atelier permettront de trancher.'
    default:
      return 'Rien d\'alarmant pour l\'instant — on peut avancer méthodiquement.'
  }
}

function conversationalOpener(analysis: SavHeuristicAnalysis): string {
  const device = SAV_DEVICE_LABELS[analysis.deviceCategory]
  const top = analysis.matchedSymptoms[0]

  if (!top) {
    return `Pour ce **${device}**, j'aurais besoin de préciser le symptôme : est-ce à l'allumage, à l'écran, à la charge, ou un bruit particulier ?`
  }

  const prob = top.probability ?? 0
  if (prob >= 45) {
    return `OK, sur un **${device}**, votre description correspond fortement à un souci de **${top.rule.label.toLowerCase()}** (~${prob} %). ${urgencyIntro(analysis.urgency)}`
  }

  return `Sur **${device}**, je pencherais pour **${top.rule.label.toLowerCase()}**, mais je garderais une seconde piste ouverte le temps des tests. ${urgencyIntro(analysis.urgency)}`
}

export function buildConversationalIntro(
  input: SavAnalysisInput,
  analysis: SavHeuristicAnalysis,
): string {
  const parts = [conversationalOpener(analysis)]

  if (analysis.matchedSymptoms.length > 1) {
    const sec = analysis.matchedSymptoms[1]
    parts.push(`Également détecté : *${sec.rule.label}* (${sec.probability ?? 0} %).`)
  }

  if (input.existingDiagnostic?.trim()) {
    parts.push(`Je prends en compte le diagnostic existant : « ${input.existingDiagnostic.slice(0, 120)} ».`)
  }

  return parts.join('\n\n')
}

export function buildWorkshopClosing(analysis: SavHeuristicAnalysis): string {
  const test = analysis.testProcedures[0]
  const comp = analysis.suspectComponents.slice(0, 2).join(' et ') || 'les composants listés'
  return test
    ? `_Prochaine étape atelier : ${test}. Si confirmé → contrôle ${comp}._`
    : '_Complétez le symptôme pour affiner le plan de test._'
}
