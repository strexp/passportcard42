<script setup lang="ts">
import { NButton, NIcon, NTabPane, NTabs, NTag, NText, useDialog, useMessage } from 'naive-ui'
import { AlertCircleOutline, CheckmarkCircleOutline, RefreshOutline } from '@vicons/ionicons5'

import DocumentPanel from '@/components/editor/DocumentPanel.vue'
import IdentityPanel from '@/components/editor/IdentityPanel.vue'
import MrzPanel from '@/components/editor/MrzPanel.vue'
import PortraitPanel from '@/components/editor/PortraitPanel.vue'
import { fontsReady, mrzReady, resetCard } from '@/composables/useCardStore'
import { useEditorState } from '@/composables/useEditorState'

const dialog = useDialog()
const message = useMessage()
const { activeTab, clearMrzImport } = useEditorState()

function resetAll(): void {
  dialog.warning({
    title: 'Restore sample data?',
    content: 'Your current fields, portrait and MRZ will be replaced by the sample card.',
    positiveText: 'Restore sample',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      resetCard()
      clearMrzImport()
      message.success('Sample data restored.')
    },
  })
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-head">
      <div>
        <NText depth="3" class="eyebrow">CARD EDITOR</NText>
        <h1>Card details</h1>
      </div>
      <NTag size="small" :bordered="false" :type="mrzReady ? 'success' : 'warning'">
        <template #icon>
          <NIcon :component="mrzReady ? CheckmarkCircleOutline : AlertCircleOutline" />
        </template>
        {{ mrzReady ? 'MRZ valid' : 'Check MRZ' }}
      </NTag>
    </div>

    <NTabs
      v-model:value="activeTab"
      type="line"
      animated
      size="small"
      class="editor-tabs"
      justify-content="space-evenly"
    >
      <NTabPane name="identity" tab="Identity">
        <IdentityPanel />
      </NTabPane>
      <NTabPane name="document" tab="Document">
        <DocumentPanel />
      </NTabPane>
      <NTabPane name="portrait" tab="Portrait">
        <PortraitPanel />
      </NTabPane>
      <NTabPane name="mrz" tab="MRZ">
        <MrzPanel />
      </NTabPane>
    </NTabs>

    <div class="sidebar-foot">
      <NButton size="small" quaternary @click="resetAll">
        <template #icon><NIcon :component="RefreshOutline" /></template>
        Reset sample
      </NButton>
      <NText depth="3" class="footer-state">
        {{ fontsReady ? 'Card fonts loaded' : 'Fallback fonts' }}
      </NText>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--line);
  background: var(--panel);
}

.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 10px;
}

.eyebrow {
  display: block;
  margin-bottom: 3px;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.14em;
}

.sidebar-head h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.editor-tabs {
  flex: 1;
  min-height: 0;
}

.editor-tabs :deep(.n-tabs-nav) {
  padding: 0 10px;
}

.editor-tabs :deep(.n-tabs-nav-scroll-content) {
  display: flex;
  width: 100%;
}

.editor-tabs :deep(.n-tabs-tab) {
  padding-left: 8px;
  padding-right: 8px;
  white-space: nowrap;
}

.sidebar-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-top: 1px solid var(--line);
}

.footer-state {
  font-size: 11px;
  white-space: nowrap;
}

@media (max-width: 1024px) {
  .sidebar {
    border-right: 0;
    border-top: 1px solid var(--line);
  }
}

@media (max-width: 680px) {
  .editor-tabs :deep(.n-tabs-nav) {
    padding: 0 4px;
  }

  .editor-tabs :deep(.n-tabs-tab) {
    padding-left: 2px;
    padding-right: 2px;
  }

  .footer-state {
    display: none;
  }
}
</style>
