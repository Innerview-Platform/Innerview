import type { Area } from 'react-easy-crop'

/** Mirrors UploadLimits on the backend. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const RESUME_ACCEPT = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Quick client-side check (the server re-checks the actual file content). */
export function resumeProblem(file: File): string | null {
  const name = file.name.toLowerCase()
  if (!name.endsWith('.pdf') && !name.endsWith('.docx')) return 'Choose a PDF or Word (.docx) file.'
  if (file.size > MAX_UPLOAD_BYTES) return 'The file is larger than 5 MB.'
  return null
}

export function imageProblem(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return 'Choose a JPEG, PNG or WebP image.'
  if (file.size > MAX_UPLOAD_BYTES) return 'The image is larger than 5 MB.'
  return null
}

/**
 * Cuts the chosen square out of the image and scales it to at most `maxSize` px, so uploads stay small
 * (the server still re-encodes it to 512 px and 128 px).
 */
export async function cropToSquareJpeg(imageUrl: string, area: Area, maxSize = 1024): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Couldn't read the image"))
    img.src = imageUrl
  })
  const size = Math.min(maxSize, Math.round(area.width))
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not supported')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, size, size)
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size, size)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't crop the image"))), 'image/jpeg', 0.92),
  )
}
