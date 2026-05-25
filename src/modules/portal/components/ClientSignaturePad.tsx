import { useCallback, useRef, useState } from 'react'
import { Eraser, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

type ClientSignaturePadProps = {
  onSave: (dataUrl: string) => void
  onClear?: () => void
  className?: string
  label?: string
}

export function ClientSignaturePad({
  onSave,
  onClear,
  className,
  label = 'Signature',
}: ClientSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const [hasStroke, setHasStroke] = useState(false)

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    ctx.strokeStyle = '#00cfff'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    return { ctx, w: rect.width, h: rect.height }
  }, [])

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    const pack = getCtx()
    if (!pack) return
    drawingRef.current = true
    const { x, y } = pointerPos(e)
    pack.ctx.beginPath()
    pack.ctx.moveTo(x, y)
    canvasRef.current?.setPointerCapture(e.pointerId)
  }

  function draw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    const pack = getCtx()
    if (!pack) return
    const { x, y } = pointerPos(e)
    pack.ctx.lineTo(x, y)
    pack.ctx.stroke()
    setHasStroke(true)
  }

  function endDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = false
    canvasRef.current?.releasePointerCapture(e.pointerId)
  }

  function clear() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasStroke(false)
    onClear?.()
  }

  function save() {
    const canvas = canvasRef.current
    if (!canvas || !hasStroke) return
    onSave(canvas.toDataURL('image/png'))
  }

  return (
    <div className={cn('rounded-2xl border border-border bg-surface-elevated p-4', className)}>
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <PenLine className="size-4 text-neon-blue" />
          {label}
        </span>
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"
        >
          <Eraser className="size-3.5" />
          Effacer
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="h-36 w-full touch-none rounded-xl border border-dashed border-neon-blue/30 bg-background/80"
        onPointerDown={startDraw}
        onPointerMove={draw}
        onPointerUp={endDraw}
        onPointerLeave={endDraw}
      />
      <Button className="mt-3 w-full" size="sm" disabled={!hasStroke} onClick={save}>
        Valider la signature
      </Button>
    </div>
  )
}
