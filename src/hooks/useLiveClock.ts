import { useEffect, useState } from 'react'

type ClockState = {
  time: string
  date: string
}

function formatClock(now: Date): ClockState {
  return {
    time: now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    date: now.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
  }
}

export function useLiveClock(): ClockState {
  const [clock, setClock] = useState<ClockState>(() => formatClock(new Date()))

  useEffect(() => {
    const interval = setInterval(() => {
      setClock(formatClock(new Date()))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return clock
}
