import { computed } from 'vue'
import { saveAs } from 'file-saver'
import { useMessage } from 'naive-ui'
import type { UploadCustomRequestOptions } from 'naive-ui'

import { applyMrzText, cardData, mrzText } from '@/composables/useCardStore'
import { useEditorState } from '@/composables/useEditorState'
import { readFileAsText } from '@/lib/files'
import { documentStem } from '@/lib/filename'

/** Import, validate, copy and download the generated MRZ. */
export function useMrzImport() {
  const message = useMessage()
  const { importMrzText, importFeedback, setSide } = useEditorState()
  const stem = computed(() => documentStem(cardData.documentNumber))

  function applyImport(): void {
    if (!importMrzText.value.trim()) {
      message.warning('Paste three MRZ lines first.')
      return
    }

    const result = applyMrzText(importMrzText.value)
    importFeedback.value = { ok: result.ok, issues: result.issues }
    if (result.ok) {
      message.success('MRZ validated and applied.')
      setSide('back')
    } else {
      message.warning(result.issues[0] ?? 'The MRZ could not be fully validated.')
    }
  }

  async function handleUpload({
    file,
    onFinish,
    onError,
  }: UploadCustomRequestOptions): Promise<void> {
    if (!file.file) {
      onError()
      return
    }

    try {
      importMrzText.value = (await readFileAsText(file.file)).trim()
      onFinish()
      applyImport()
    } catch (error) {
      onError()
      message.error(error instanceof Error ? error.message : 'Could not read the file.')
    }
  }

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(mrzText.value)
      message.success('MRZ copied to the clipboard.')
    } catch {
      message.error('Could not access the clipboard.')
    }
  }

  function download(): void {
    saveAs(new Blob([mrzText.value], { type: 'text/plain;charset=utf-8' }), `${stem.value}-mrz.txt`)
  }

  return { applyImport, handleUpload, copy, download }
}
