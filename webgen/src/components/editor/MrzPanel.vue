<script setup lang="ts">
import { computed } from 'vue'
import {
  NAlert,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  NIcon,
  NInput,
  NSpace,
  NTag,
  NUpload,
} from 'naive-ui'
import {
  AlertCircleOutline,
  CheckmarkCircleOutline,
  CloudUploadOutline,
  CopyOutline,
  DownloadOutline,
  FingerPrintOutline,
} from '@vicons/ionicons5'

import EditorPanel from '@/components/editor/EditorPanel.vue'
import {
  birthDateLabel,
  cardData,
  expiryDateLabel,
  issueDateLabel,
  mrzReady,
  mrzResult,
  mrzText,
} from '@/composables/useCardStore'
import { useEditorState } from '@/composables/useEditorState'
import { useMrzImport } from '@/composables/useMrzImport'
import { DEFAULT_MRZ_TEXT } from '@/lib/defaults'

const { importMrzText, importFeedback } = useEditorState()
const { applyImport, handleUpload, copy, download } = useMrzImport()

const checkItems = computed(() => [
  { label: 'Document', value: mrzResult.value.checks.documentNumber },
  { label: 'Birth date', value: mrzResult.value.checks.birthDate },
  { label: 'Expiry date', value: mrzResult.value.checks.expiryDate },
  { label: 'Composite', value: mrzResult.value.checks.composite },
])

const holderName = computed(() => [cardData.givenNames, cardData.surname].filter(Boolean).join(' '))
</script>

<template>
  <EditorPanel>
    <NCard size="small" title="Generated MRZ">
      <template #header-extra>
        <NTag size="small" :bordered="false" :type="mrzReady ? 'success' : 'warning'">
          <template #icon>
            <NIcon :component="mrzReady ? CheckmarkCircleOutline : AlertCircleOutline" />
          </template>
          {{ mrzReady ? '3 × 30' : 'Needs attention' }}
        </NTag>
      </template>
      <NInput
        :value="mrzText"
        type="textarea"
        readonly
        :autosize="{ minRows: 3, maxRows: 3 }"
        class="mrz-textarea"
      />
      <NSpace justify="space-between" align="center" class="panel-actions">
        <NButton size="tiny" secondary @click="copy">
          <template #icon><NIcon :component="CopyOutline" /></template>
          Copy
        </NButton>
        <NButton size="tiny" secondary @click="download">
          <template #icon><NIcon :component="DownloadOutline" /></template>
          Download .txt
        </NButton>
      </NSpace>
    </NCard>

    <NDescriptions :column="2" size="small" bordered class="checks">
      <NDescriptionsItem v-for="item in checkItems" :key="item.label" :label="item.label">
        <NTag size="small" :bordered="false" type="success">{{ item.value }}</NTag>
      </NDescriptionsItem>
    </NDescriptions>

    <NAlert
      v-if="mrzResult.warnings.length"
      type="warning"
      :bordered="false"
      title="Check these fields"
    >
      <ul class="warning-list">
        <li v-for="warning in mrzResult.warnings" :key="warning">{{ warning }}</li>
      </ul>
    </NAlert>
    <NAlert v-else type="success" :bordered="false" title="All check digits are in sync">
      Document, birth date, expiry date and composite check digits are calculated from the form.
    </NAlert>

    <NDivider />
    <NText strong>Import an MRZ</NText>
    <NText depth="3" class="hint">
      Paste three TD1 MRZ lines to restore the fields, or load a plain-text file.
    </NText>
    <NInput
      v-model:value="importMrzText"
      type="textarea"
      :autosize="{ minRows: 4, maxRows: 6 }"
      :placeholder="DEFAULT_MRZ_TEXT"
      class="import-textarea"
    />
    <NSpace justify="space-between" align="center" class="panel-actions">
      <NUpload accept=".txt,text/plain" :show-file-list="false" :custom-request="handleUpload">
        <NButton size="small" secondary>
          <template #icon><NIcon :component="CloudUploadOutline" /></template>
          Load .txt
        </NButton>
      </NUpload>
      <NButton size="small" type="primary" @click="applyImport">
        <template #icon><NIcon :component="FingerPrintOutline" /></template>
        Apply MRZ
      </NButton>
    </NSpace>
    <NAlert
      v-if="importFeedback"
      :type="importFeedback.ok ? 'success' : 'warning'"
      :bordered="false"
      :title="importFeedback.ok ? 'MRZ applied' : 'MRZ applied with warnings'"
      class="import-feedback"
    >
      <ul v-if="importFeedback.issues.length" class="warning-list">
        <li v-for="issue in importFeedback.issues" :key="issue">{{ issue }}</li>
      </ul>
      <span v-else>The fields were restored from the imported MRZ.</span>
    </NAlert>

    <NDivider />
    <NDescriptions :column="1" size="small" label-placement="left" class="summary">
      <NDescriptionsItem label="Holder">{{ holderName }}</NDescriptionsItem>
      <NDescriptionsItem label="Birth date">{{ birthDateLabel }}</NDescriptionsItem>
      <NDescriptionsItem label="Issued">{{ issueDateLabel }}</NDescriptionsItem>
      <NDescriptionsItem label="Expires">{{ expiryDateLabel }}</NDescriptionsItem>
    </NDescriptions>
  </EditorPanel>
</template>

<style scoped>
.mrz-textarea :deep(textarea) {
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.8;
  letter-spacing: 0.02em;
}

.import-textarea :deep(textarea) {
  font-family: var(--font-mono);
  font-size: 12px;
}

.checks {
  margin: 14px 0;
}

.import-feedback {
  margin-top: 12px;
}

.summary {
  margin-top: 8px;
}
</style>
