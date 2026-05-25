import { useState } from 'react'
import { motion } from 'framer-motion'
import type { CalendarEvent } from '@/modules/calendar/types/calendar-module.types'
import type { ScheduleFormValues } from '@/modules/calendar/types/calendar-module.types'
import { useCalendarPlanning } from '@/modules/calendar/hooks/useCalendarPlanning'
import { CalendarToolbar } from '@/modules/calendar/components/CalendarToolbar'
import { CalendarSidebar } from '@/modules/calendar/components/CalendarSidebar'
import { DayView } from '@/modules/calendar/components/DayView'
import { WeekView } from '@/modules/calendar/components/WeekView'
import { MonthView } from '@/modules/calendar/components/MonthView'
import { ScheduleAppointmentModal } from '@/modules/calendar/components/ScheduleAppointmentModal'
import { QuickEditEventModal } from '@/modules/calendar/components/QuickEditEventModal'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'
import { startOfDay } from '@/modules/calendar/utils/calendar-dates'
import { toast } from '@/store/toast.store'
import { useAuthStore } from '@/store/auth.store'
import { emitFeedItem } from '@/features/notifications/services/feed.service'
import { ROUTES } from '@/config/routes'
import { GoogleCalendarSyncBanner } from '@/modules/calendar/components/GoogleCalendarSyncBanner'
import { useGoogleCalendarStore } from '@/store/google-calendar.store'
import { staggerContainer, fadeInUp } from '@/utils/motion'

export function CalendarPage() {
  const userId = useAuthStore((state) => state.user?.id)
  const planning = useCalendarPlanning()
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleDefaultDate, setScheduleDefaultDate] = useState<Date | undefined>()
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  async function handleSchedule(values: ScheduleFormValues) {
    if (values.interventionId) {
      const updated = await planning.updateIntervention(values.interventionId, {
        scheduledAt: values.scheduledAt,
        durationMinutes: values.durationMinutes,
        priority: values.priority,
        status: values.status,
      })
      if (updated) {
        await notifyScheduled(userId, updated.id, updated.reportedIssue, values.scheduledAt)
        void useGoogleCalendarStore.getState().pushIntervention(updated.id)
        setScheduleOpen(false)
      }
      return
    }

    const created = await planning.createIntervention({
      clientId: values.clientId,
      reportedIssue: values.reportedIssue,
      status: values.status,
      scheduledAt: values.scheduledAt,
      durationMinutes: values.durationMinutes,
      priority: values.priority,
    })
    if (created) {
      await notifyScheduled(userId, created.id, created.reportedIssue, values.scheduledAt)
      void useGoogleCalendarStore.getState().pushIntervention(created.id)
      setScheduleOpen(false)
    }
  }

  async function handleQuickSave(payload: {
    interventionId: string
    scheduledAt: string
    durationMinutes: number
    priority: ScheduleFormValues['priority']
    status: ScheduleFormValues['status']
  }) {
    const updated = await planning.updateIntervention(payload.interventionId, payload)
    if (updated) {
      toast.success('Planning mis à jour')
      void useGoogleCalendarStore.getState().pushIntervention(updated.id)
      setSelectedEvent(null)
    }
  }

  async function handleReschedule(interventionId: string, scheduledAt: string, durationMinutes: number) {
    const updated = await planning.rescheduleEvent(interventionId, scheduledAt, durationMinutes)
    if (updated) {
      toast.success('Créneau déplacé', 'Intervention replanifiée.')
      void useGoogleCalendarStore.getState().pushIntervention(updated.id)
    }
  }

  if (planning.loading) {
    return (
      <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
        <TableSkeleton rows={10} />
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8"
    >
      <motion.div variants={fadeInUp}>
        <CalendarToolbar
          view={planning.view}
          anchorDate={planning.anchorDate}
          onViewChange={planning.setView}
          onPrev={planning.goPrev}
          onNext={planning.goNext}
          onToday={planning.goToday}
          onNewAppointment={() => {
            setScheduleDefaultDate(planning.anchorDate)
            setScheduleOpen(true)
          }}
        />
      </motion.div>

      <motion.div variants={fadeInUp}>
        <GoogleCalendarSyncBanner />
      </motion.div>

      <motion.div variants={fadeInUp} className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <CalendarSidebar
          todayEvents={planning.todayEvents}
          urgentEvents={planning.urgentEvents}
          upcomingEvents={planning.upcomingEvents}
          onSelectEvent={setSelectedEvent}
        />

        <Card className="min-h-[680px] overflow-hidden p-0">
          {planning.view === 'day' ? (
            <DayView
              day={planning.anchorDate}
              events={planning.visibleEvents}
              onSelectEvent={setSelectedEvent}
              onReschedule={handleReschedule}
            />
          ) : null}
          {planning.view === 'week' ? (
            <WeekView
              anchor={planning.anchorDate}
              events={planning.visibleEvents}
              onSelectEvent={setSelectedEvent}
              onReschedule={handleReschedule}
            />
          ) : null}
          {planning.view === 'month' ? (
            <MonthView
              anchor={planning.anchorDate}
              events={planning.visibleEvents}
              onSelectEvent={setSelectedEvent}
              onSelectDay={(day) => {
                planning.setAnchorDate(startOfDay(day))
                planning.setView('day')
              }}
            />
          ) : null}
        </Card>
      </motion.div>

      <ScheduleAppointmentModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        clients={planning.clients}
        interventions={planning.interventions}
        defaultDate={scheduleDefaultDate}
        saving={planning.saving}
        onSubmit={handleSchedule}
      />

      <QuickEditEventModal
        open={Boolean(selectedEvent)}
        event={selectedEvent}
        saving={planning.saving}
        onClose={() => setSelectedEvent(null)}
        onSave={handleQuickSave}
      />
    </motion.div>
  )
}

async function notifyScheduled(
  userId: string | undefined,
  interventionId: string,
  title: string,
  scheduledAt: string,
) {
  if (!userId) return
  await emitFeedItem(
    userId,
    {
      kind: 'intervention_scheduled',
      title: 'Rendez-vous planifié',
      message: `${title.slice(0, 60)} · ${new Date(scheduledAt).toLocaleString('fr-FR')}`,
      href: ROUTES.CALENDAR,
      entityType: 'intervention',
      entityId: interventionId,
      dedupeKey: `intervention_scheduled:${interventionId}:${scheduledAt.slice(0, 16)}`,
    },
    { toast: true },
  )
}
