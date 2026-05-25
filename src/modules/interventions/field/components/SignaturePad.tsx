import { useEffect, useRef, useState } from 'react'
import { Eraser } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

type SignaturePadProps = {
  label: string
  value?: string
  onChange: (dataUrl: string | undefined) => void
  className?: string
}

type Point = { x: number; y: number }

export function SignaturePad({ label, value, onChange, className }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<Point | null>(null)
  const [hasStroke, setHasStroke] = useState(Boolean(value))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !value) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const image = new Image()
    image.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      setHasStroke(true)
    }
    image.src = value
  }, [value])

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    }
  }

  const startDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(event.pointerId)
    drawingRef.current = true
    lastPointRef.current = getPoint(event)
  }

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const last = lastPointRef.current
    if (!canvas || !ctx || !last) return

    const point = getPoint(event)
    ctx.strokeStyle = '#e8f4ff'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastPointRef.current = point
    setHasStroke(true)
  }

  const endDraw = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastPointRef.current = null
    const canvas = canvasRef.current
    if (!canvas) return
    onChange(canvas.toDataURL('image/png'))
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    setHasStroke(false)
    onChange(undefined)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-text-secondary">{label}</span>
        <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
          <Eraser className="size-3.5" />
          Effacer
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/80 bg-[#0a0f18] ring-1 ring-neon-blue/10">
        <canvas
          ref={canvasRef}
          width={480}
          height={160}
          className="h-40 w-full touch-none cursor-crosshair"
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
        />
      </div>
      {!hasStroke ? (
        <p className="text-[11px] text-text-muted">Signez avec la souris ou le doigt (tablette / mobile).</p>
      ) : null}
    </div>
  )
}
