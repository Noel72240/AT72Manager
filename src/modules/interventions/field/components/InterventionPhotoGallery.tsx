import { useCallback, useRef, useState } from 'react'
import { AlertCircle, Camera, ImagePlus, Loader2, Trash2, ZoomIn } from 'lucide-react'
import type { InterventionPhoto } from '@/types/entities/intervention.types'
import { MAX_INTERVENTION_PHOTOS } from '@/modules/interventions/field/types/field.types'
import { readFilesAsPhotos } from '@/modules/interventions/field/utils/image-utils'
import { photoDebug } from '@/modules/interventions/field/utils/photo-debug'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/utils/cn'

type InterventionPhotoGalleryProps = {
  photos: InterventionPhoto[]
  onPhotosChange: (updater: (previous: InterventionPhoto[]) => InterventionPhoto[]) => void
  disabled?: boolean
}

export function InterventionPhotoGallery({
  photos,
  onPhotosChange,
  disabled,
}: InterventionPhotoGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<InterventionPhoto | null>(null)
  const [brokenIds, setBrokenIds] = useState<Set<string>>(new Set())

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null)

      const remaining = MAX_INTERVENTION_PHOTOS - photos.length
      if (remaining <= 0) {
        setError(`Maximum ${MAX_INTERVENTION_PHOTOS} photos par intervention.`)
        return
      }

      setUploading(true)
      try {
        const batch = Array.from(files).slice(0, remaining)
        photoDebug.log('Ajout batch', { count: batch.length, names: batch.map((f) => f.name) })

        const newPhotos = await readFilesAsPhotos(batch)

        onPhotosChange((current) => {
          const merged = [...current, ...newPhotos].slice(0, MAX_INTERVENTION_PHOTOS)
          photoDebug.log('State photos mis à jour', { total: merged.length })
          return merged
        })
      } catch (importError) {
        const message =
          importError instanceof Error ? importError.message : 'Import photo impossible.'
        setError(message)
        photoDebug.error('Import échoué', importError)
      } finally {
        setUploading(false)
      }
    },
    [onPhotosChange, photos.length],
  )

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    if (disabled || uploading) return
    if (event.dataTransfer.files.length > 0) {
      await addFiles(event.dataTransfer.files)
    }
  }

  const removePhoto = (id: string) => {
    photoDebug.log('Suppression photo', id)
    onPhotosChange((current) => current.filter((photo) => photo.id !== id))
    setBrokenIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleImageError = (photoId: string) => {
    photoDebug.warn('Preview image error', photoId)
    setBrokenIds((prev) => new Set(prev).add(photoId))
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled && !uploading) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
          dragOver
            ? 'border-neon-blue/60 bg-neon-blue/5'
            : 'border-border/80 bg-surface-hover/20',
          (disabled || uploading) && 'pointer-events-none opacity-60',
        )}
      >
        {uploading ? (
          <Loader2 className="mx-auto size-8 animate-spin text-neon-blue" />
        ) : (
          <ImagePlus className="mx-auto size-8 text-neon-blue/80" />
        )}
        <p className="mt-2 text-sm font-medium text-text-primary">
          {uploading ? 'Traitement des images…' : 'Glissez vos photos ici'}
        </p>
        <p className="mt-1 text-xs text-text-muted">
          JPEG, PNG, WebP · {photos.length}/{MAX_INTERVENTION_PHOTOS}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            Ajouter une photo
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<Camera className="size-4" />}
            disabled={uploading}
            onClick={() => cameraRef.current?.click()}
          >
            Prendre une photo
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) void addFiles(event.target.files)
            event.target.value = ''
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) void addFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => {
            const broken = brokenIds.has(photo.id) || !photo.dataUrl?.startsWith('data:image')

            return (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-xl border border-border/80 bg-surface-hover/30"
              >
                {broken ? (
                  <div className="flex aspect-[4/3] flex-col items-center justify-center gap-1 bg-danger/10 p-2 text-center">
                    <AlertCircle className="size-5 text-danger" />
                    <p className="text-[10px] text-danger">Aperçu indisponible</p>
                  </div>
                ) : (
                  <img
                    src={photo.dataUrl}
                    alt={photo.name}
                    className="aspect-[4/3] w-full object-cover"
                    onError={() => handleImageError(photo.id)}
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    aria-label="Aperçu"
                    disabled={broken}
                    onClick={() => setPreview(photo)}
                  >
                    <ZoomIn className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    aria-label="Supprimer"
                    onClick={() => removePhoto(photo.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <p className="truncate px-2 py-1 text-[10px] text-text-muted">{photo.name}</p>
              </div>
            )
          })}
        </div>
      ) : null}

      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.name ?? 'Aperçu'}
        size="lg"
      >
        {preview?.dataUrl ? (
          <img
            src={preview.dataUrl}
            alt={preview.name}
            className="max-h-[70vh] w-full rounded-lg object-contain"
          />
        ) : null}
      </Modal>
    </div>
  )
}
