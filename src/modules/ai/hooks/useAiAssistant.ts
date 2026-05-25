import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Client, Device, Intervention } from '@/types/entities'
import type { InterventionFormValues } from '@/modules/interventions/types/intervention-module.types'
import { clientsRepository } from '@/services/database/repositories/clients.repository'
import { devicesRepository } from '@/services/database/repositories/devices.repository'
import { interventionsRepository } from '@/services/database/repositories/interventions.repository'
import { sparePartsRepository } from '@/services/database/repositories/spare-parts.repository'
import { buildSavAiContext } from '@/services/ai/context/sav-context.builder'
import { buildSavTrendInsights } from '@/services/ai/analytics/sav-analytics'
import type { SavAiContext, SavTrendInsight } from '@/services/ai/types'
import { getClientFullName } from '@/modules/clients/utils/client-name'
import { useAuthStore } from '@/store/auth.store'
import { useAiStore } from '@/store/ai.store'
import { env } from '@/config/env'

export function useAiAssistant() {
  const userId = useAuthStore((state) => state.user?.id)
  const setContextBinding = useAiStore((state) => state.setContextBinding)
  const setInterventionPool = useAiStore((state) => state.setInterventionPool)
  const loadHistory = useAiStore((state) => state.loadHistory)
  const providerLabel = useAiStore((state) => state.providerLabel)

  const [clients, setClients] = useState<Client[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [trends, setTrends] = useState<SavTrendInsight | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoadingData(true)
      try {
        const [clientRows, deviceRows, interventionRows, partRows] = await Promise.all([
          clientsRepository.list(),
          devicesRepository.list(),
          interventionsRepository.list(),
          sparePartsRepository.list(),
        ])
        if (cancelled) return
        setClients(clientRows)
        setDevices(deviceRows)
        setInterventions(interventionRows)
        setInterventionPool(
          interventionRows.map((item) => ({
            id: item.id,
            reportedIssue: item.reportedIssue,
            status: item.status,
            brand: item.brand,
            model: item.model,
            deviceLabel: item.deviceLabel,
            diagnostic: item.diagnostic,
            technicianNotes: item.technicianNotes,
            scheduledAt: item.scheduledAt,
            priority: item.priority,
            updatedAt: item.updatedAt,
          })),
        )

        const activeIntervention = interventionRows
          .filter((i) => !['completed', 'returned'].includes(i.status))
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]

        const activeClient = activeIntervention
          ? clientRows.find((c) => c.id === activeIntervention.clientId)
          : undefined

        const trendsInsight = buildSavTrendInsights(interventionRows, partRows)
        setTrends(trendsInsight)

        setContextBinding({
          label: activeIntervention
            ? activeClient
              ? getClientFullName(activeClient)
              : activeIntervention.reportedIssue.slice(0, 32)
            : 'Vue atelier globale',
          context: buildSavAiContext({
            client: activeClient,
            intervention: activeIntervention ?? null,
            parts: partRows,
            interventions: interventionRows,
            includeTrends: true,
          }),
        })
      } finally {
        if (!cancelled) setLoadingData(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [setContextBinding, setInterventionPool])

  useEffect(() => {
    if (userId) void loadHistory(userId)
  }, [userId, loadHistory])

  const bindInterventionForm = useCallback(
    (values: InterventionFormValues, intervention?: Intervention | null) => {
      const client = clients.find((c) => c.id === values.clientId)
      const device = intervention?.deviceId
        ? devices.find((d) => d.id === intervention.deviceId)
        : undefined

      const draftIntervention: Intervention | null = intervention ?? {
        id: 'draft',
        userId: userId ?? '',
        clientId: values.clientId,
        deviceId: device?.id,
        reportedIssue: values.reportedIssue,
        diagnostic: values.diagnostic,
        technicianNotes: values.technicianNotes,
        status: values.status,
        brand: values.brand,
        model: values.model || values.customModel,
        deviceLabel: values.deviceLabel,
        estimatedPrice: undefined,
        finalPrice: undefined,
        partsLines: values.partsLines,
        media: values.media,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const context = buildSavAiContext({
        client,
        device,
        intervention: draftIntervention,
        interventions,
        includeTrends: false,
      })

      const label = client ? getClientFullName(client) : 'Intervention en cours'

      setContextBinding({ label, context })
      return context
    },
    [clients, devices, interventions, setContextBinding, userId],
  )

  const bindEntityContext = useCallback(
    (input: {
      client?: Client | null
      device?: Device | null
      intervention?: Intervention | null
      label?: string
    }) => {
      const context = buildSavAiContext({
        client: input.client,
        device: input.device,
        intervention: input.intervention,
        interventions,
        includeTrends: true,
      })
      const label =
        input.label ??
        (input.client ? getClientFullName(input.client) : undefined) ??
        input.intervention?.reportedIssue?.slice(0, 32) ??
        'Contexte SAV'
      setContextBinding({ label, context })
      return context
    },
    [interventions, setContextBinding],
  )

  const globalContext = useMemo(
    (): SavAiContext =>
      buildSavAiContext({
        interventions,
        includeTrends: true,
      }),
    [interventions],
  )

  return {
    userId,
    loadingData,
    trends,
    globalContext,
    providerLabel,
    isAiEnabled: env.isAiEnabled,
    usesCloud: env.isOpenAiConfigured,
    bindInterventionForm,
    bindEntityContext,
  }
}
