import imageCompression from 'browser-image-compression'

/** Read a file into a data URL. */
export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file.'))
    reader.readAsDataURL(file)
  })
}

/** Compress an image and convert it to WebP where the browser supports it. */
export function compressImage(file: File, maxWidthOrHeight: number): Promise<File> {
  return imageCompression(file, {
    maxWidthOrHeight,
    initialQuality: 0.92,
    fileType: 'image/webp',
    useWebWorker: true,
  })
}

/** Validate that a file is a supported image within a size limit. */
export function assertImageFile(file: File, maxBytes: number): void {
  if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) {
    throw new Error('Choose a PNG, JPEG or WebP image.')
  }
  if (file.size > maxBytes) {
    throw new Error(`The image must be smaller than ${Math.round(maxBytes / 1024 / 1024)} MB.`)
  }
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file.'))
    reader.readAsText(file)
  })
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
