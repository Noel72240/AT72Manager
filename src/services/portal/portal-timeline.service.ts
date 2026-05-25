import type { Intervention, InterventionStatus } from '@/types/entities'
import type { PortalRepairEvent, PortalRepairStage, PortalRepairTimelineStep } from '@/types/portal.types'

const STAGE_ORDER: PortalRepairStage[] = [
  'received',
  'diagnostic',
  'parts_ordered',
  'repair_in_progress',
  'completed',
  'ready_pickup',
]

const STAGE_LABELS: Record<PortalRepairStage, string> = {
  received: 'Réception atelier',
  diagnostic: 'Diagnostic',
  parts_ordered: 'Pièce commandée',
  repair_in_progress: 'Réparation en cours',
  completed: 'Réparation terminée',
  ready_pickup: 'Prêt à récupérer',
}

function statusToStage(status: InterventionStatus): PortalRepairStage {
  switch (status) {
    case 'diagnostic':
      return 'diagnostic'
    case 'waiting_parts':
      return 'parts_ordered'
    case 'in_progress':
      return 'repair_in_progress'
    case 'completed':
      return 'completed'
    case 'returned':
      return 'ready_pickup'
    default:
      return 'received'
  }
}

function stageIndex(stage: PortalRepairStage): number {
  return STAGE_ORDER.indexOf(stage)
}

export function buildRepairTimeline(
  intervention: Intervention,
  customEvents: PortalRepairEvent[] = [],
): PortalRepairTimelineStep[] {
  const currentStage = statusToStage(intervention.status)
  const currentIdx = stageIndex(currentStage)

  const eventByStage = new Map<PortalRepairStage, PortalRepairEvent>()
  for (const event of customEvents) {
    if (event.interventionId === intervention.id) {
      eventByStage.set(event.stage, event)
    }
  }

  return STAGE_ORDER.map((stage, index) => {
    const custom = eventByStage.get(stage)
    let stepStatus: PortalRepairTimelineStep['status'] = 'pending'
    if (index < currentIdx) stepStatus = 'done'
    else if (index === currentIdx) stepStatus = 'active'

    return {
      id: `${intervention.id}-${stage}`,
      stage,
      label: custom?.label ?? STAGE_LABELS[stage],
      description: custom?.note ?? undefined,
      at:
        stepStatus === 'done' || stepStatus === 'active'
          ? custom?.createdAt ?? intervention.updatedAt
          : undefined,
      status: stepStatus,
    }
  })
}

export function getTimelineProgress(steps: PortalRepairTimelineStep[]): number {
  const done = steps.filter((s) => s.status === 'done').length
  const active = steps.some((s) => s.status === 'active') ? 0.5 : 0
  return Math.round(((done + active) / steps.length) * 100)
}
