<script setup lang="ts">
import {
  NButton,
  NButtonGroup,
  NIcon,
  NPopover,
  NRadioButton,
  NRadioGroup,
  NSpace,
  NText,
  NTooltip,
} from 'naive-ui'
import {
  AddOutline,
  ChevronDownOutline,
  DocumentTextOutline,
  DownloadOutline,
  RemoveOutline,
} from '@vicons/ionicons5'

import ExportDialog from '@/components/dialogs/ExportDialog.vue'
import { useCardExport } from '@/composables/useCardExport'
import { cardData } from '@/composables/useCardStore'
import { useEditorState } from '@/composables/useEditorState'

const { side, sideLabel, zoomLabel, adjustZoom, resetZoom } = useEditorState()
const {
  exportOpen,
  exporting,
  templateOpen,
  templateBusy,
  openExport,
  handleExport,
  downloadTemplate,
} = useCardExport()
</script>

<template>
  <div class="toolbar">
    <NSpace align="center">
      <NRadioGroup v-model:value="side" size="small">
        <NRadioButton value="front">Front</NRadioButton>
        <NRadioButton value="back">Back</NRadioButton>
      </NRadioGroup>
      <NText depth="3" class="preview-label">{{ sideLabel }} preview</NText>
    </NSpace>

    <NSpace align="center">
      <NButtonGroup size="small">
        <NButton aria-label="Zoom out" @click="adjustZoom(-0.1)">
          <NIcon :component="RemoveOutline" />
        </NButton>
        <NTooltip>
          <template #trigger>
            <NButton @click="resetZoom">{{ zoomLabel }}</NButton>
          </template>
          Reset zoom to 100%
        </NTooltip>
        <NButton aria-label="Zoom in" @click="adjustZoom(0.1)">
          <NIcon :component="AddOutline" />
        </NButton>
      </NButtonGroup>

      <NPopover
        v-model:show="templateOpen"
        trigger="click"
        placement="bottom-end"
        :show-arrow="false"
        style="padding: 0"
        content-style="padding: 0"
      >
        <template #trigger>
          <NButton secondary :loading="templateBusy !== null">
            <template #icon>
              <NIcon :component="DocumentTextOutline" />
            </template>
            Template
            <NIcon :component="ChevronDownOutline" :size="13" class="button-caret" />
          </NButton>
        </template>
        <div class="template-menu">
          <div class="template-copy">
            <NText strong>Offline template</NText>
            <NText depth="3" class="template-hint">
              Editable SVG of the current card. Fonts and guide layers are embedded; open it in a
              local SVG editor.
            </NText>
          </div>
          <NButton
            block
            secondary
            :loading="templateBusy === 'front'"
            :disabled="templateBusy !== null"
            @click="downloadTemplate('front')"
          >
            <template #icon><NIcon :component="DownloadOutline" /></template>
            Front template (.svg)
          </NButton>
          <NButton
            block
            secondary
            :loading="templateBusy === 'back'"
            :disabled="templateBusy !== null"
            @click="downloadTemplate('back')"
          >
            <template #icon><NIcon :component="DownloadOutline" /></template>
            Back template (.svg)
          </NButton>
        </div>
      </NPopover>

      <NButton type="primary" @click="openExport">
        <template #icon><NIcon :component="DownloadOutline" /></template>
        Export
      </NButton>
    </NSpace>

    <ExportDialog
      v-model:show="exportOpen"
      :side="side"
      :doc-number="cardData.documentNumber"
      :busy="exporting"
      @export="handleExport"
    />
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 22px;
  border-bottom: 1px solid var(--line);
  background: rgba(12, 14, 16, 0.55);
}

.preview-label {
  font-size: 11px;
}

.button-caret {
  margin-left: 4px;
  opacity: 0.65;
}

.template-menu {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(250px, calc(100vw - 48px));
  padding: 14px;
}

.template-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 2px;
}

.template-hint {
  display: block;
  font-size: 11px;
  line-height: 1.5;
}

@media (max-width: 680px) {
  .toolbar {
    flex-wrap: wrap;
    padding: 10px 14px;
  }

  .preview-label {
    display: none;
  }
}
</style>
