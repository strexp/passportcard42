<script setup lang="ts">
import {
  NButton,
  NForm,
  NFormItem,
  NIcon,
  NImage,
  NInput,
  NRadioButton,
  NRadioGroup,
  NText,
  NUpload,
} from 'naive-ui'
import { CloudUploadOutline } from '@vicons/ionicons5'

import { cardData } from '@/composables/useCardStore'
import { DEFAULT_CARD_DATA } from '@/lib/defaults'
import { useSignatureImage } from '@/composables/useSignatureImage'

const { busy, handleUpload, handleMode, remove } = useSignatureImage()
</script>

<template>
  <NForm label-placement="top" size="small" :show-feedback="false">
    <NFormItem label="Signature style">
      <NRadioGroup :value="cardData.signatureMode" size="small" @update:value="handleMode">
        <NRadioButton value="font">Font</NRadioButton>
        <NRadioButton value="image">Image</NRadioButton>
      </NRadioGroup>
    </NFormItem>
    <NFormItem v-if="cardData.signatureMode === 'font'" label="Signature text">
      <NInput
        v-model:value="cardData.signature"
        :placeholder="DEFAULT_CARD_DATA.signature"
        :maxlength="40"
      />
    </NFormItem>
    <template v-else>
      <NUpload
        accept="image/png,image/jpeg,image/webp"
        :show-file-list="false"
        :disabled="busy"
        :custom-request="handleUpload"
      >
        <NButton size="small" secondary :loading="busy">
          <template #icon><NIcon :component="CloudUploadOutline" /></template>
          Upload signature
        </NButton>
      </NUpload>
      <NText depth="3" class="hint signature-name">
        {{ cardData.signatureImageName || 'No signature image uploaded.' }}
      </NText>
      <NImage
        v-if="cardData.signatureImageSrc"
        :src="cardData.signatureImageSrc"
        width="180"
        class="signature-preview"
      />
      <NButton v-if="cardData.signatureImageSrc" size="tiny" quaternary @click="remove">
        Remove image
      </NButton>
    </template>
  </NForm>
  <NText depth="3" class="hint">
    Use a transparent PNG for the cleanest result. The image is placed above the signature line.
  </NText>
</template>

<style scoped>
.signature-name {
  margin: 8px 0;
}

.signature-preview {
  margin: 8px 0;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
}
</style>
