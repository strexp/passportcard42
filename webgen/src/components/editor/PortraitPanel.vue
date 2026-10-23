<script setup lang="ts">
import { NButton, NDivider, NIcon, NText, NUpload, NUploadDragger } from 'naive-ui'
import { CloudUploadOutline, RefreshOutline } from '@vicons/ionicons5'

import PortraitCropDialog from '@/components/dialogs/PortraitCropDialog.vue'
import EditorPanel from '@/components/editor/EditorPanel.vue'
import SignatureEditor from '@/components/editor/SignatureEditor.vue'
import { cardData, restoreSamplePortrait } from '@/composables/useCardStore'
import { usePortraitCrop } from '@/composables/usePortraitCrop'

const {
  cropOpen,
  source: cropSource,
  preparing,
  handleUpload: handlePortraitUpload,
  handleConfirm: handlePortraitConfirm,
  handleClosed: handlePortraitClosed,
} = usePortraitCrop()
</script>

<template>
  <EditorPanel>
    <NUpload
      accept="image/png,image/jpeg,image/webp"
      :show-file-list="false"
      :disabled="preparing"
      :custom-request="handlePortraitUpload"
    >
      <NUploadDragger class="portrait-upload">
        <NIcon :component="CloudUploadOutline" :size="28" />
        <NText>{{
          preparing ? 'Preparing image…' : 'Drop a portrait here or click to browse'
        }}</NText>
        <NText depth="3" class="hint">PNG, JPEG or WebP · portrait orientation recommended</NText>
      </NUploadDragger>
    </NUpload>
    <div class="inline-actions">
      <NText depth="3">{{ cardData.photoName }}</NText>
      <NButton size="tiny" quaternary @click="restoreSamplePortrait">
        <template #icon><NIcon :component="RefreshOutline" /></template>
        Use sample
      </NButton>
    </div>

    <NText depth="3" class="hint crop-note">
      Uploads open a crop dialog: drag the frame to reposition it and use the corner handles to
      resize. The 4:5 ratio is locked, and scrolling zooms the image.
    </NText>

    <NDivider />
    <SignatureEditor />

    <PortraitCropDialog
      v-model:show="cropOpen"
      :source="cropSource"
      @confirm="handlePortraitConfirm"
      @closed="handlePortraitClosed"
    />
  </EditorPanel>
</template>

<style scoped>
.portrait-upload {
  padding: 22px 16px;
}

.portrait-upload .n-icon {
  margin-bottom: 8px;
}

.portrait-upload .n-text {
  display: block;
}

.inline-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
}

.inline-actions > .n-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.crop-note {
  margin-top: 14px;
}
</style>
