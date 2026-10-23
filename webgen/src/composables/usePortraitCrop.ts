import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import type { UploadCustomRequestOptions } from 'naive-ui'

import { applyPortraitImage } from '@/composables/useCardStore'
import { preparePortraitSource } from '@/lib/portrait'
import type { PortraitSource } from '@/lib/portrait'

/** Upload preparation and crop-dialog state for the portrait panel. */
export function usePortraitCrop() {
  const message = useMessage()

  const cropOpen = ref(false)
  const source = ref<PortraitSource | null>(null)
  const preparing = ref(false)

  async function handleUpload({
    file,
    onFinish,
    onError,
  }: UploadCustomRequestOptions): Promise<void> {
    if (!file.file) {
      onError()
      return
    }

    preparing.value = true
    try {
      source.value = await preparePortraitSource(file.file)
      cropOpen.value = true
      onFinish()
    } catch (error) {
      onError()
      message.error(error instanceof Error ? error.message : 'Could not process the image.')
    } finally {
      preparing.value = false
    }
  }

  function handleConfirm(payload: { dataUrl: string; name: string }): void {
    applyPortraitImage(payload.dataUrl, payload.name)
    message.success('Portrait cropped to 4:5 and updated.')
  }

  function handleClosed(): void {
    source.value = null
  }

  return {
    cropOpen,
    source,
    preparing,
    handleUpload,
    handleConfirm,
    handleClosed,
  }
}
