import { photoDebug } from '@/modules/interventions/field/utils/photo-debug'
import type { InterventionPhoto } from '@/types/entities/intervention.types'

const MAX_DIMENSION = 1024
const JPEG_QUALITY = 0.78
const MAX_BYTES_HINT = 400_000

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Lecture du fichier impossible.'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('FileReader a échoué.'))
    reader.readAsDataURL(file)
  })
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image illisible.'))
    img.src = dataUrl
  })
}

async function compressFromImageSource(
  source: CanvasImageSource,
  width: number,
  height: number,
  fileName: string,
): Promise<{ dataUrl: string; name: string; byteSize: number }> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Impossible de traiter l\'image.')

  ctx.drawImage(source, 0, 0, width, height)
  let quality = JPEG_QUALITY
  let dataUrl = canvas.toDataURL('image/jpeg', quality)
  let byteSize = Math.ceil((dataUrl.length * 3) / 4)

  while (byteSize > MAX_BYTES_HINT && quality > 0.45) {
    quality -= 0.08
    dataUrl = canvas.toDataURL('image/jpeg', quality)
    byteSize = Math.ceil((dataUrl.length * 3) / 4)
  }

  photoDebug.log('Image compressée', { fileName, width, height, byteSize, quality })

  return { dataUrl, name: fileName, byteSize }
}

export async function compressImageFile(file: File): Promise<{ dataUrl: string; name: string }> {
  if (!file.type.startsWith('image/') && !file.name.match(/\.(jpe?g|png|webp|heic|heif)$/i)) {
    throw new Error('Le fichier doit être une image (JPEG, PNG, WebP).')
  }

  photoDebug.log('Import fichier', { name: file.name, type: file.type, size: file.size })

  try {
    if (typeof createImageBitmap === 'function' && file.type !== 'image/heic' && file.type !== 'image/heif') {
      const bitmap = await createImageBitmap(file)
      const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
      const width = Math.round(bitmap.width * scale)
      const height = Math.round(bitmap.height * scale)
      const result = await compressFromImageSource(bitmap, width, height, file.name)
      bitmap.close()
      return { dataUrl: result.dataUrl, name: result.name }
    }
  } catch (error) {
    photoDebug.warn('createImageBitmap indisponible, repli FileReader', error)
  }

  const dataUrl = await readFileAsDataUrl(file)
  const img = await loadImageFromDataUrl(dataUrl)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
  const width = Math.round(img.width * scale)
  const height = Math.round(img.height * scale)
  const result = await compressFromImageSource(img, width, height, file.name)
  return { dataUrl: result.dataUrl, name: result.name }
}

export async function readFilesAsPhotos(files: FileList | File[]): Promise<InterventionPhoto[]> {
  const list = Array.from(files).filter((file) => file.size > 0)
  if (list.length === 0) {
    throw new Error('Aucun fichier image valide sélectionné.')
  }

  const results: InterventionPhoto[] = []

  for (const file of list) {
    try {
      const { dataUrl, name } = await compressImageFile(file)
      results.push({
        id: crypto.randomUUID(),
        name,
        dataUrl,
        createdAt: new Date().toISOString(),
        syncStatus: 'local',
      })
    } catch (error) {
      photoDebug.error('Échec import', file.name, error)
      throw error instanceof Error ? error : new Error('Import photo impossible.')
    }
  }

  photoDebug.log('Photos importées', { count: results.length })
  return results
}
