import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import type { UploadCustomRequestOptions } from 'naive-ui'

import {
  applySignatureFile,
  clearSignatureImage,
  setSignatureMode,
} from '@/composables/useCardStore'

/** Signature image upload and mode switching for the portrait panel. */
export function useSignatureImage() {
  const message = useMessage()
  const busy = ref(false)

  async function handleUpload({
    file,
    onFinish,
    onError,
  }: UploadCustomRequestOptions): Promise<void> {
    if (!file.file) {
      onError()
      return
    }

    busy.value = true
    try {
      await applySignatureFile(file.file)
      onFinish()
      message.success('Signature image updated.')
    } catch (error) {
      onError()
      message.error(error instanceof Error ? error.message : 'Could not process the image.')
    } finally {
      busy.value = false
    }
  }

  function handleMode(value: string | number | boolean | null): void {
    if (value === 'font' || value === 'image') setSignatureMode(value)
  }

  function remove(): void {
    clearSignatureImage()
    setSignatureMode('font')
    message.info('Signature image removed.')
  }

  return { busy, handleUpload, handleMode, remove }
}
