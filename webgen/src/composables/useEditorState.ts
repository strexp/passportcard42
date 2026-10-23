import { computed, ref } from 'vue'

import type { CardSide } from '@/types/card'

export type EditorTab = 'identity' | 'document' | 'portrait' | 'mrz'

export interface MrzImportFeedback {
  ok: boolean
  issues: string[]
}

const MIN_ZOOM = 0.6
const MAX_ZOOM = 1.6

const activeTab = ref<EditorTab>('identity')
const side = ref<CardSide>('front')
const zoom = ref(1)
const importMrzText = ref('')
const importFeedback = ref<MrzImportFeedback | null>(null)

const sideLabel = computed(() => (side.value === 'front' ? 'Front' : 'Back'))
const zoomLabel = computed(() => `${Math.round(zoom.value * 100)}%`)

function setSide(value: CardSide): void {
  side.value = value
}

function adjustZoom(delta: number): void {
  zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((zoom.value + delta).toFixed(2))))
}

function resetZoom(): void {
  zoom.value = 1
}

function clearMrzImport(): void {
  importMrzText.value = ''
  importFeedback.value = null
}

/**
 * Ephemeral editor UI state shared by the sidebar, preview and import tools.
 * Card data itself lives in `useCardStore`.
 */
export function useEditorState() {
  return {
    activeTab,
    side,
    zoom,
    importMrzText,
    importFeedback,
    sideLabel,
    zoomLabel,
    setSide,
    adjustZoom,
    resetZoom,
    clearMrzImport,
  }
}
