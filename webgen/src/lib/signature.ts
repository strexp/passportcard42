import { assertImageFile, compressImage, fileToDataUrl } from '@/lib/files'

interface TrimmedSignature {
  dataUrl: string
  width: number
  height: number
}

function trimSignature(dataUrl: string): Promise<TrimmedSignature> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onerror = () => reject(new Error('Could not trim the signature image.'))
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Canvas is not supported in this browser.'))
        return
      }
      context.drawImage(image, 0, 0)
      const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height)

      let hasAlpha = false
      for (let index = 3; index < data.length; index += 4) {
        if (data[index] < 250) {
          hasAlpha = true
          break
        }
      }

      let minX = width
      let minY = height
      let maxX = -1
      let maxY = -1
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const offset = (y * width + x) * 4
          const alpha = data[offset + 3] ?? 0
          const red = data[offset] ?? 0
          const green = data[offset + 1] ?? 0
          const blue = data[offset + 2] ?? 0
          const isInk = hasAlpha
            ? alpha > 20
            : alpha > 20 && (red < 245 || green < 245 || blue < 245)
          if (isInk) {
            minX = Math.min(minX, x)
            minY = Math.min(minY, y)
            maxX = Math.max(maxX, x)
            maxY = Math.max(maxY, y)
          }
        }
      }

      if (maxX < minX || maxY < minY) {
        resolve({ dataUrl, width, height })
        return
      }

      const padding = 4
      const cropX = Math.max(0, minX - padding)
      const cropY = Math.max(0, minY - padding)
      const cropWidth = Math.min(width - cropX, maxX - minX + 1 + padding * 2)
      const cropHeight = Math.min(height - cropY, maxY - minY + 1 + padding * 2)

      const output = document.createElement('canvas')
      output.width = cropWidth
      output.height = cropHeight
      const outputContext = output.getContext('2d')
      if (!outputContext) {
        reject(new Error('Canvas is not supported in this browser.'))
        return
      }
      outputContext.drawImage(
        canvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
      )
      if (!hasAlpha) {
        const pixels = outputContext.getImageData(0, 0, cropWidth, cropHeight)
        for (let index = 0; index < pixels.data.length; index += 4) {
          const red = pixels.data[index] ?? 0
          const green = pixels.data[index + 1] ?? 0
          const blue = pixels.data[index + 2] ?? 0
          const brightness = (red + green + blue) / 3
          pixels.data[index + 3] = brightness > 245 ? 0 : Math.round(255 - brightness)
        }
        outputContext.clearRect(0, 0, cropWidth, cropHeight)
        outputContext.putImageData(pixels, 0, 0)
      }
      let trimmed = output.toDataURL('image/webp', 0.95)
      if (!trimmed.startsWith('data:image/webp')) {
        trimmed = output.toDataURL('image/png')
      }
      resolve({ dataUrl: trimmed, width: cropWidth, height: cropHeight })
    }
    image.src = dataUrl
  })
}

export interface PreparedSignature {
  dataUrl: string
  name: string
  width: number
  height: number
}

/** Compress a signature image while preserving transparency. */
export async function prepareSignature(file: File): Promise<PreparedSignature> {
  assertImageFile(file, 10 * 1024 * 1024)
  const compressed = await compressImage(file, 1200)
  const dataUrl = await fileToDataUrl(compressed)
  const trimmed = await trimSignature(dataUrl)
  return { ...trimmed, name: file.name }
}
