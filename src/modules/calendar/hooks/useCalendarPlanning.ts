import { useCallback, useMemo, useState } from 'react'
import type { CalendarViewMode } from '@/modules/calendar/types/calendar-module.types'
import {
  addDays,
  getViewRange,
  startOfDay,
} from '@/modules/calendar/utils/calendar-dates'
import {
  filterEventsInRange,
  getTodayEvents,
  getUpcomingEvents,
  getUrgentEvents,
  mapInterventionsToEvents,
} from '@/modules/calendar/utils/calendar-events'
import { useInterventions } from '@/modules/interventions/hooks/useInterventions'
import { useClients } from '@/modules/clients/hooks/useClients'

export function useCalendarPlanning() {
  const { interventions, loading: interventionsLoading, saving, updateIntervention, createIntervention, fetchInterventions } =
    useInterventions()
  const { clients, loading: clientsLoading } = useClients()

  const [view, setView] = useState<CalendarViewMode>('week')
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(new Date()))

  const events = useMemo(
    () => mapInterventionsToEvents(interventions, clients),
    [interventions, clients],
  )

  const range = useMemo(() => getViewRange(view, anchorDate), [view, anchorDate])

  const visibleEvents = useMemo(
    () => filterEventsInRange(events, range.start, range.end),
    [events, range.end, range.start],
  )

  const todayEvents = useMemo(() => getTodayEvents(events), [events])
  const urgentEvents = useMemo(() => getUrgentEvents(events), [events])
  const upcomingEvents = useMemo(() => getUpcomingEvents(events), [events])

  const goToday = useCallback(() => setAnchorDate(startOfDay(new Date())), [])

  const goPrev = useCallback(() => {
    setAnchorDate((current) => {
      if (view === 'day') return addDays(current, -1)
      if (view === 'week') return addDays(current, -7)
      return new Date(current.getFullYear(), current.getMonth() - 1, 1)
    })
  }, [view])

  const goNext = useCallback(() => {
    setAnchorDate((current) => {
      if (view === 'day') return addDays(current, 1)
      if (view === 'week') return addDays(current, 7)
      return new Date(current.getFullYear(), current.getMonth() + 1, 1)
    })
  }, [view])

  const rescheduleEvent = useCallback(
    async (interventionId: string, scheduledAt: string, durationMinutes?: number) => {
      const payload: Parameters<typeof updateIntervention>[1] = { scheduledAt }
      if (durationMinutes !== undefined) payload.durationMinutes = durationMinutes
      return updateIntervention(interventionId, payload)
    },
    [updateIntervention],
  )

  return {
    view,
    setView,
    anchorDate,
    setAnchorDate,
    events,
    visibleEvents,
    todayEvents,
    urgentEvents,
    upcomingEvents,
    range,
    loading: interventionsLoading || clientsLoading,
    saving,
    clients,
    interventions,
    goToday,
    goPrev,
    goNext,
    rescheduleEvent,
    createIntervention,
    updateIntervention,
    refresh: fetchInterventions,
  }
}
