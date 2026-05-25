import type { Intervention, SparePart } from '@/types/entities'
import type { SavTrendInsight } from '@/services/ai/types'
import { STATUS_LABELS } from '@/modules/interventions/utils/intervention-labels'

function tokenizeIssue(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3)
}

export function buildSavTrendInsights(
  interventions: Intervention[],
  parts: SparePart[] = [],
): SavTrendInsight {
  const issueCounts = new Map<string, number>()
  const partCounts = new Map<string, number>()
  const statusCounts = new Map<string, number>()

  for (const item of interventions) {
    statusCounts.set(item.status, (statusCounts.get(item.status) ?? 0) + 1)
    for (const token of tokenizeIssue(item.reportedIssue)) {
      issueCounts.set(token, (issueCounts.get(token) ?? 0) + 1)
    }
    for (const line of item.partsLines ?? []) {
      if (line.kind === 'part' && line.description) {
        partCounts.set(line.description, (partCounts.get(line.description) ?? 0) + 1)
      }
    }
  }

  const frequentIssues = [...issueCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }))

  const recurringParts = [...partCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  const statusBreakdown = [...statusCounts.entries()].map(([status, count]) => ({
    status: STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status,
    count,
  }))

  const topIssue = frequentIssues[0]?.label
  const summary = [
    `${interventions.length} intervention(s) analysée(s).`,
    topIssue ? `Mot-clé panne fréquent : « ${topIssue} ».` : '',
    recurringParts[0] ? `Pièce récurrente : ${recurringParts[0].name}.` : '',
    parts.length ? `Catalogue : ${parts.length} pièce(s) référencée(s).` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return { frequentIssues, recurringParts, statusBreakdown, summary }
}

export function formatTrendsForPrompt(insight: SavTrendInsight): string {
  const lines = [insight.summary]
  if (insight.frequentIssues.length) {
    lines.push('Pannes fréquentes (mots-clés): ' + insight.frequentIssues.map((i) => `${i.label}(${i.count})`).join(', '))
  }
  if (insight.recurringParts.length) {
    lines.push('Pièces récurrentes: ' + insight.recurringParts.map((p) => `${p.name}(${p.count})`).join(', '))
  }
  if (insight.statusBreakdown.length) {
    lines.push('Répartition statuts: ' + insight.statusBreakdown.map((s) => `${s.status}:${s.count}`).join(', '))
  }
  return lines.join('\n')
}
