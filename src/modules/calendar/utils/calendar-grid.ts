export const CALENDAR_HOUR_START = 7
export const CALENDAR_HOUR_END = 20
export const CALENDAR_HOUR_HEIGHT = 52

export function getCalendarHours(): number[] {
  return Array.from(
    { length: CALENDAR_HOUR_END - CALENDAR_HOUR_START + 1 },
    (_, i) => CALENDAR_HOUR_START + i,
  )
}

export function getEventTop(start: Date): number {
  const minutes = start.getHours() * 60 + start.getMinutes() - CALENDAR_HOUR_START * 60
  return Math.max(0, (minutes / 60) * CALENDAR_HOUR_HEIGHT)
}

export function getEventHeight(durationMinutes: number): number {
  return Math.max(28, (durationMinutes / 60) * CALENDAR_HOUR_HEIGHT)
}

export function slotFromDropY(y: number, day: Date): Date {
  const hourOffset = y / CALENDAR_HOUR_HEIGHT
  const totalMinutes = Math.round((CALENDAR_HOUR_START + hourOffset) * 60 / 15) * 15
  const result = new Date(day)
  result.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0)
  return result
}
