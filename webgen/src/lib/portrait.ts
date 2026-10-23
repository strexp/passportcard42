import Cropper from 'cropperjs'
import type { CropperSelection } from 'cropperjs'

import { assertImageFile, compressImage, fileToDataUrl } from '@/lib/files'

/** 26 × 32.5 mm ICAO photo window, as a width / height ratio. */
export const PORTRAIT_ASPECT_RATIO = 26 / 32.5
export const PORTRAIT_CROP_WIDTH = 1040
export const PORTRAIT_CROP_HEIGHT = 1300

const HANDLE_COLOR = 'rgba(216, 243, 106, 0.9)'

/**
 * Interactive 4:5 cropper used by the portrait dialog. The selection aspect
 * ratio is locked so the result always fits the photo window; the image can be
 * scrolled to zoom while the crop frame stays inside it.
 */
export const PORTRAIT_CROPPER_TEMPLATE = `
  <cropper-canvas style="width: 100%; height: 100%">
    <cropper-image scalable min-fit="contain"></cropper-image>
    <cropper-shade></cropper-shade>
    <cropper-selection
      aspect-ratio="${PORTRAIT_ASPECT_RATIO}"
      initial-aspect-ratio="${PORTRAIT_ASPECT_RATIO}"
      initial-coverage="1"
      precise
      movable
      resizable
      outlined
      theme-color="#d8f36a"
    >
      <cropper-grid role="grid" covered></cropper-grid>
      <cropper-handle action="move" theme-color="transparent"></cropper-handle>
      <cropper-handle action="n-resize" theme-color="${HANDLE_COLOR}"></cropper-handle>
      <cropper-handle action="e-resize" theme-color="${HANDLE_COLOR}"></cropper-handle>
      <cropper-handle action="s-resize" theme-color="${HANDLE_COLOR}"></cropper-handle>
      <cropper-handle action="w-resize" theme-color="${HANDLE_COLOR}"></cropper-handle>
      <cropper-handle action="ne-resize" theme-color="${HANDLE_COLOR}"></cropper-handle>
      <cropper-handle action="nw-resize" theme-color="${HANDLE_COLOR}"></cropper-handle>
      <cropper-handle action="se-resize" theme-color="${HANDLE_COLOR}"></cropper-handle>
      <cropper-handle action="sw-resize" theme-color="${HANDLE_COLOR}"></cropper-handle>
    </cropper-selection>
  </cropper-canvas>
`

/** Attach the portrait cropper to an existing image element and container. */
export function createPortraitCropper(image: HTMLImageElement, container: HTMLElement): Cropper {
  return new Cropper(image, {
    container,
    template: PORTRAIT_CROPPER_TEMPLATE,
  })
}

export interface PortraitSource {
  /** Compressed source image, used as the cropper input and preview. */
  src: string
  name: string
}

/**
 * Validate and compress an uploaded portrait, ready to be shown in the crop
 * dialog. Cropping only happens after the user confirms the selection.
 */
export async function preparePortraitSource(file: File): Promise<PortraitSource> {
  assertImageFile(file, 20 * 1024 * 1024)
  const compressed = await compressImage(file, 1600)
  return { src: await fileToDataUrl(compressed), name: file.name }
}

/** Render the current crop selection at the final 4:5 photo resolution. */
export async function renderPortraitCrop(selection: CropperSelection): Promise<string> {
  const canvas = await selection.$toCanvas({
    width: PORTRAIT_CROP_WIDTH,
    height: PORTRAIT_CROP_HEIGHT,
    beforeDraw(context) {
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
    },
  })
  const dataUrl = canvas.toDataURL('image/webp', 0.92)
  return dataUrl.startsWith('data:image/webp') ? dataUrl : canvas.toDataURL('image/png')
}
