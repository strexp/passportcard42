import { computed, ref } from 'vue'
import { saveAs } from 'file-saver'
import { useMessage } from 'naive-ui'

import { cardData, persistImmediately } from '@/composables/useCardStore'
import { formatBytes } from '@/lib/files'
import { getCardSvg } from '@/lib/cardDom'
import { exportRaster, exportSvg, exportTemplateSvg } from '@/lib/export'
import { documentStem } from '@/lib/filename'
import type { CardSide, ExportRequest } from '@/types/card'

/** Export dialog state plus SVG/PNG/WebP and offline template downloads. */
export function useCardExport() {
  const message = useMessage()

  const exportOpen = ref(false)
  const exporting = ref(false)
  const templateOpen = ref(false)
  const templateBusy = ref<CardSide | null>(null)
  const stem = computed(() => documentStem(cardData.documentNumber))

  function openExport(): void {
    exportOpen.value = true
  }

  async function handleExport(request: ExportRequest): Promise<void> {
    if (exporting.value) return
    exporting.value = true
    try {
      await document.fonts.ready
      const svg = getCardSvg(request.side)
      const blob =
        request.format === 'png' || request.format === 'webp'
          ? await exportRaster(svg, request)
          : await exportSvg(svg, request)
      const extension = request.format.startsWith('svg') ? 'svg' : request.format
      const suffix = request.format === 'svg-outlined' ? 'outlined' : request.format
      saveAs(blob, `${stem.value}-${request.side}-${suffix}.${extension}`)
      persistImmediately()
      exportOpen.value = false
      message.success(`Exported ${request.side} card (${formatBytes(blob.size)}).`)
    } catch (error) {
      console.error(error)
      message.error(error instanceof Error ? error.message : 'Export failed.')
    } finally {
      exporting.value = false
    }
  }

  async function downloadTemplate(targetSide: CardSide): Promise<void> {
    if (templateBusy.value) return
    templateBusy.value = targetSide
    try {
      await document.fonts.ready
      const blob = await exportTemplateSvg(getCardSvg(targetSide))
      saveAs(blob, `${stem.value}-${targetSide}-template.svg`)
      message.success(
        `${targetSide === 'front' ? 'Front' : 'Back'} template downloaded (${formatBytes(blob.size)}).`,
      )
    } catch (error) {
      console.error(error)
      message.error(error instanceof Error ? error.message : 'Template download failed.')
    } finally {
      templateBusy.value = null
    }
  }

  return {
    exportOpen,
    exporting,
    templateOpen,
    templateBusy,
    openExport,
    handleExport,
    downloadTemplate,
  }
}
