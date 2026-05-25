import { useCallback, useEffect, useRef, useState } from 'react'
import { initLocalDatabase } from '@/services/indexeddb/db'
import { useSyncStore } from '@/store/sync.store'
import { env } from '@/config/env'
import {
  STARTUP_MIN_DURATION_MS,
  STARTUP_PHASES,
  type StartupPhaseId,
} from '@/components/startup/startup.types'

export type StartupStatus = 'idle' | 'running' | 'complete' | 'exiting' | 'done'

const IDB_TIMEOUT_MS = 20_000
const MIN_VISIBLE_MS = 1_200

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(`${label} (${ms}ms)`)), ms)
    }),
  ])
}

function animateProgress(
  from: number,
  to: number,
  durationMs: number,
  onTick: (value: number) => void,
): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - (1 - t) ** 3
      onTick(Math.round(from + (to - from) * eased))
      if (t < 1) requestAnimationFrame(tick)
      else resolve()
    }
    requestAnimationFrame(tick)
  })
}

const PHASE_TARGETS = [30, 55, 80, 100]

let sharedBootPromise: Promise<void> | null = null
let bootCompleted = false

export function useStartup() {
  const [status, setStatus] = useState<StartupStatus>('running')
  const [progress, setProgress] = useState(8)
  const [phaseId, setPhaseId] = useState<StartupPhaseId>('system')
  const [phaseLabel, setPhaseLabel] = useState(STARTUP_PHASES[0].label)
  const [subLabel, setSubLabel] = useState<string | null>('Démarrage…')
  const progressRef = useRef(8)
  const mountedRef = useRef(true)

  const exitSplash = useCallback(async () => {
    if (!mountedRef.current) return
    progressRef.current = 100
    setProgress(100)
    setStatus('complete')
    await delay(200)
    setStatus('exiting')
    await delay(400)
    setStatus('done')
  }, [])

  const stepTo = useCallback(async (phaseIndex: number) => {
    if (!mountedRef.current) return
    const phase = STARTUP_PHASES[phaseIndex]
    const target = PHASE_TARGETS[phaseIndex] ?? 100
    if (!phase) return
    setPhaseId(phase.id)
    setPhaseLabel(phase.label)
    const from = progressRef.current
    await animateProgress(from, target, 320, (v) => {
      if (!mountedRef.current) return
      progressRef.current = v
      setProgress(v)
    })
  }, [])

  const runBootSequence = useCallback(async () => {
    const bootStart = performance.now()

    try {
      setStatus('running')
      setSubLabel('Environnement')
      await stepTo(0)

      setSubLabel('Base locale')
      await stepTo(1)
      try {
        const dbResult = await withTimeout(
          initLocalDatabase(),
          IDB_TIMEOUT_MS,
          'IndexedDB',
        )
        if (dbResult.status === 'rebuilt') {
          setSubLabel('Base reconstruite')
        } else if (dbResult.status === 'degraded') {
          setSubLabel('Mode dégradé')
        }
      } catch (error) {
        console.error('[startup] IndexedDB:', error)
        setSubLabel('Base locale — mode dégradé')
      }

      setSubLabel('Synchronisation')
      await stepTo(2)
      try {
        if (navigator.onLine) {
          await useSyncStore.getState().refresh()
        }
      } catch {
        /* non bloquant */
      }

      setSubLabel('Moteur SAV')
      await stepTo(3)
      try {
        await import('@/data/heuristics/index')
      } catch {
        /* non bloquant */
      }

      await stepTo(4)
      setSubLabel(null)

      const elapsed = performance.now() - bootStart
      if (elapsed < MIN_VISIBLE_MS) {
        await delay(MIN_VISIBLE_MS - elapsed)
      }
      if (elapsed < STARTUP_MIN_DURATION_MS) {
        await delay(Math.min(800, STARTUP_MIN_DURATION_MS - elapsed))
      }

      await exitSplash()
    } catch (error) {
      console.error('[startup] boot failed:', error)
      await exitSplash()
    }
  }, [stepTo, exitSplash])

  useEffect(() => {
    mountedRef.current = true

    if (bootCompleted) {
      setStatus('done')
      setProgress(100)
      return () => {
        mountedRef.current = false
      }
    }

    if (!sharedBootPromise) {
      sharedBootPromise = runBootSequence().then(() => {
        bootCompleted = true
      })
    }

    void sharedBootPromise.then(() => {
      if (mountedRef.current) {
        setStatus('done')
        setProgress(100)
      }
    })

    return () => {
      mountedRef.current = false
    }
  }, [runBootSequence])

  const isVisible = status !== 'done'
  const isExiting = status === 'exiting' || status === 'complete'

  return {
    status,
    progress,
    phaseId,
    phaseLabel,
    subLabel,
    isVisible,
    isExiting,
    version: env.appVersion,
  }
}
