import { useCallback, useRef, useState } from 'react'
import { FileUp, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'

type DocumentDropzoneProps = {
  disabled?: boolean
  uploading?: boolean
  progress?: number
  accept?: string
  hint?: string
  onFiles: (files: FileList | File[]) => void
}

export function DocumentDropzone({
  disabled,
  uploading,
  progress = 0,
  accept = 'application/pdf,image/jpeg,image/png,image/webp',
  hint = 'PDF, JPEG ou PNG — glissez-déposez ou cliquez',
  onFiles,
}: DocumentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      if (disabled || uploading) return
      const list = Array.from(files)
      if (list.length > 0) onFiles(list)
    },
    [disabled, onFiles, uploading],
  )

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled && !uploading) setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        void handleFiles(e.dataTransfer.files)
      }}
      className={cn(
        'relative overflow-hidden rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all',
        dragOver ? 'border-neon-blue/60 bg-neon-blue/5 scale-[1.01]' : 'border-border/80 bg-surface-hover/20',
        uploading && 'pointer-events-none opacity-80',
      )}
    >
      {uploading ? (
        <div className="space-y-3">
          <Loader2 className="mx-auto size-8 animate-spin text-neon-blue" />
          <p className="text-sm text-text-secondary">Envoi en cours… {Math.round(progress)}%</p>
          <div className="mx-auto h-1.5 max-w-xs overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-neon-blue transition-all duration-300"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      ) : (
        <>
          <FileUp className="mx-auto size-8 text-neon-blue/80" />
          <p className="mt-2 text-sm font-medium text-text-primary">Documents client</p>
          <p className="mt-1 text-xs text-text-muted">{hint}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-4"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            Parcourir…
          </Button>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
