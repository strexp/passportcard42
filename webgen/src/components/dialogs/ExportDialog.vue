<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  NButton,
  NDivider,
  NForm,
  NFormItem,
  NIcon,
  NModal,
  NRadio,
  NRadioButton,
  NRadioGroup,
  NSpace,
  NSwitch,
  NText,
} from 'naive-ui'
import {
  DocumentTextOutline,
  DownloadOutline,
  ImageOutline,
  LayersOutline,
  ShieldCheckmarkOutline,
} from '@vicons/ionicons5'

import type { CardSide, ExportFormat, ExportRequest } from '@/types/card'

const props = defineProps<{
  side: CardSide
  docNumber: string
  busy: boolean
}>()

const show = defineModel<boolean>('show', { required: true })

const emit = defineEmits<{
  export: [request: ExportRequest]
}>()

const format = ref<ExportFormat>('png')
const side = ref<CardSide>(props.side)
const dpi = ref(600)
const embedFonts = ref(true)
const transparent = ref(true)

watch(
  () => show.value,
  (visible) => {
    if (visible) side.value = props.side
  },
)

const formats: Array<{
  value: ExportFormat
  label: string
  description: string
  icon: typeof DocumentTextOutline
}> = [
  {
    value: 'svg',
    label: 'SVG',
    description: 'Editable text. Optionally embeds the card fonts.',
    icon: DocumentTextOutline,
  },
  {
    value: 'svg-outlined',
    label: 'Outlined SVG',
    description: 'All lettering converted to vector paths for print.',
    icon: LayersOutline,
  },
  {
    value: 'png',
    label: 'PNG',
    description: 'Lossless raster image with optional transparency.',
    icon: ImageOutline,
  },
  {
    value: 'webp',
    label: 'WebP',
    description: 'Compact raster image with optional transparency.',
    icon: ImageOutline,
  },
]

const pixelSize = computed(() => ({
  width: Math.round((85.6 / 25.4) * dpi.value),
  height: Math.round((53.98 / 25.4) * dpi.value),
}))
const isRaster = computed(() => format.value === 'png' || format.value === 'webp')
const selected = computed(() => formats.find((item) => item.value === format.value)!)
const outputName = computed(
  () => `${props.docNumber || 'passport-card'}-${side.value}-${selected.value.value}`,
)

function handleShowUpdate(value: boolean): void {
  if (!props.busy) show.value = value
}

function close(): void {
  if (!props.busy) show.value = false
}

function confirm(): void {
  if (props.busy) return
  emit('export', {
    format: format.value,
    side: side.value,
    dpi: dpi.value,
    embedFonts: embedFonts.value,
    transparent: transparent.value,
  })
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    title="Export artwork"
    :style="{ width: 'min(520px, calc(100vw - 32px))' }"
    :mask-closable="!busy"
    :close-on-esc="!busy"
    :closable="!busy"
    @update:show="handleShowUpdate"
  >
    <NForm class="export-form" label-placement="top" size="small" :show-feedback="false">
      <NFormItem label="Format">
        <NRadioGroup v-model:value="format" class="format-list">
          <NRadio v-for="item in formats" :key="item.value" :value="item.value">
            <div class="format-option">
              <NIcon :component="item.icon" :size="19" />
              <div>
                <NText strong>{{ item.label }}</NText>
                <NText depth="3" class="format-description">{{ item.description }}</NText>
              </div>
            </div>
          </NRadio>
        </NRadioGroup>
      </NFormItem>

      <NDivider />

      <NFormItem label="Card side">
        <NRadioGroup v-model:value="side" size="small">
          <NRadioButton value="front">Front</NRadioButton>
          <NRadioButton value="back">Back</NRadioButton>
        </NRadioGroup>
      </NFormItem>

      <NFormItem v-if="isRaster" label="Resolution">
        <NRadioGroup v-model:value="dpi" size="small">
          <NRadioButton :value="300">300 DPI</NRadioButton>
          <NRadioButton :value="600">600 DPI</NRadioButton>
          <NRadioButton :value="900">900 DPI</NRadioButton>
        </NRadioGroup>
        <NText depth="3" class="field-note">
          {{ pixelSize.width }} × {{ pixelSize.height }} px
        </NText>
      </NFormItem>

      <NFormItem v-if="format === 'svg'" label="Fonts">
        <NSpace vertical size="small">
          <NSwitch v-model:value="embedFonts" />
          <NText depth="3">
            Embed the card fonts in the SVG. Recommended for sharing; makes the file larger.
          </NText>
        </NSpace>
      </NFormItem>

      <NFormItem v-if="isRaster" label="Background">
        <NSpace vertical size="small">
          <NSwitch v-model:value="transparent" />
          <NText depth="3">Keep the area outside the rounded card transparent.</NText>
        </NSpace>
      </NFormItem>

      <NText depth="3" class="output-name">
        <NIcon :component="ShieldCheckmarkOutline" :size="14" />
        {{ outputName }}
      </NText>
    </NForm>

    <template #footer>
      <div class="modal-footer">
        <NSpace>
          <NButton :disabled="busy" @click="close">Cancel</NButton>
          <NButton type="primary" :loading="busy" @click="confirm">
            <template #icon>
              <NIcon :component="DownloadOutline" />
            </template>
            Export
          </NButton>
        </NSpace>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.export-form :deep(.n-form-item) {
  margin-bottom: 16px;
}

.export-form :deep(.n-form-item:last-child) {
  margin-bottom: 0;
}

.format-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.format-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding-left: 2px;
}

.format-option > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.format-description {
  display: block;
  font-size: 12px;
  line-height: 1.45;
  white-space: normal;
}

.field-note {
  display: block;
  margin-top: 6px;
  font-size: 11px;
}

.output-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20px;
}

@media (max-width: 560px) {
  .modal-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
