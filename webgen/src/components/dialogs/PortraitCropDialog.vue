<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NModal, NSpace, NSpin, NText, useMessage } from 'naive-ui'
import type Cropper from 'cropperjs'

import {
  createPortraitCropper,
  PORTRAIT_CROP_HEIGHT,
  PORTRAIT_CROP_WIDTH,
  renderPortraitCrop,
} from '@/lib/portrait'
import type { PortraitSource } from '@/lib/portrait'

const props = defineProps<{
  source: PortraitSource | null
}>()

const show = defineModel<boolean>('show', { required: true })

const emit = defineEmits<{
  confirm: [payload: { dataUrl: string; name: string }]
  closed: []
}>()

const message = useMessage()

const stage = ref<HTMLDivElement | null>(null)
const sourceImage = ref<HTMLImageElement | null>(null)
const cropper = ref<Cropper | null>(null)
const ready = ref(false)
const busy = ref(false)
const error = ref<string | null>(null)

function resetCropper(): void {
  cropper.value?.destroy()
  cropper.value = null
  ready.value = false
  error.value = null
}

/**
 * Keep the crop frame inside both the canvas and the displayed image, even
 * after the image is zoomed with the mouse wheel.
 */
function updateSelectionBounds(): void {
  const instance = cropper.value
  const selection = instance?.getCropperSelection()
  const cropperImage = instance?.getCropperImage()
  const canvas = instance?.getCropperCanvas()
  if (!selection || !cropperImage || !canvas) return

  const canvasRect = canvas.getBoundingClientRect()
  const imageRect = cropperImage.getBoundingClientRect()
  const top = Math.max(0, imageRect.top - canvasRect.top)
  const right = Math.max(0, canvasRect.right - imageRect.right)
  const bottom = Math.max(0, canvasRect.bottom - imageRect.bottom)
  const left = Math.max(0, imageRect.left - canvasRect.left)
  selection.minInset = `${top}px ${right}px ${bottom}px ${left}px`
}

function startCropper(): void {
  resetCropper()
  const image = sourceImage.value
  const host = stage.value
  if (!image || !host || !props.source) return

  try {
    const instance = createPortraitCropper(image, host)
    cropper.value = instance
    const cropperImage = instance.getCropperImage()
    const selection = instance.getCropperSelection()
    if (!cropperImage || !selection) {
      throw new Error('Could not start the portrait cropper.')
    }
    cropperImage.addEventListener('transform', () => {
      requestAnimationFrame(updateSelectionBounds)
    })
    cropperImage.$ready().then(
      () => {
        updateSelectionBounds()
        ready.value = true
      },
      () => {
        error.value = 'The image could not be loaded.'
      },
    )
  } catch (cause) {
    console.error(cause)
    error.value = cause instanceof Error ? cause.message : 'Could not start the cropper.'
  }
}

function handleShowUpdate(value: boolean): void {
  if (!busy.value) show.value = value
}

function close(): void {
  if (!busy.value) show.value = false
}

async function confirmCrop(): Promise<void> {
  const selection = cropper.value?.getCropperSelection()
  if (!selection || !props.source || !ready.value || busy.value) return

  busy.value = true
  try {
    const dataUrl = await renderPortraitCrop(selection)
    emit('confirm', { dataUrl, name: props.source.name })
    show.value = false
  } catch (cause) {
    console.error(cause)
    message.error(cause instanceof Error ? cause.message : 'Could not crop the image.')
  } finally {
    busy.value = false
  }
}

function handleAfterLeave(): void {
  resetCropper()
  emit('closed')
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    title="Crop portrait"
    :style="{ width: 'min(660px, calc(100vw - 24px))' }"
    :mask-closable="!busy"
    :close-on-esc="!busy"
    :closable="!busy"
    :auto-focus="false"
    @update:show="handleShowUpdate"
    @after-enter="startCropper"
    @after-leave="handleAfterLeave"
  >
    <div class="crop-card">
      <div ref="stage" class="crop-stage">
        <img
          v-if="source"
          ref="sourceImage"
          :src="source.src"
          alt="Portrait to crop"
          class="crop-source"
        />
        <div v-if="!ready && !error" class="crop-overlay">
          <NSpin size="medium" />
        </div>
        <div v-if="error" class="crop-overlay">
          <NText type="error">{{ error }}</NText>
        </div>
      </div>

      <div class="crop-copy">
        <NText strong class="crop-name">{{ source?.name }}</NText>
        <NText depth="3" class="hint">
          Drag the frame to reposition it, and use the handles to resize. The 4:5 ratio is locked.
          Scroll over the image to zoom.
        </NText>
        <NText depth="3" class="crop-size">
          Output {{ PORTRAIT_CROP_WIDTH }} × {{ PORTRAIT_CROP_HEIGHT }} px · 26 × 32.5 mm
        </NText>
      </div>
    </div>

    <template #footer>
      <NSpace justify="end">
        <NButton :disabled="busy" @click="close">Cancel</NButton>
        <NButton type="primary" :loading="busy" :disabled="!ready || !!error" @click="confirmCrop">
          Use portrait
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.crop-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.crop-stage {
  position: relative;
  width: 100%;
  height: min(54vh, 520px);
  min-height: 300px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 10px;
  background:
    radial-gradient(circle at 50% 40%, rgba(216, 243, 106, 0.04), transparent 60%), #07080a;
}

.crop-stage :deep(cropper-canvas) {
  width: 100%;
  height: 100%;
}

.crop-source {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.45;
}

.crop-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  pointer-events: none;
}

.crop-copy {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.crop-name {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hint {
  font-size: 11px;
  line-height: 1.55;
}

.crop-size {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.04em;
}

@media (max-width: 680px) {
  .crop-stage {
    height: min(48vh, 420px);
    min-height: 240px;
  }
}
</style>
