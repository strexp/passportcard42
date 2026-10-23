<script setup lang="ts">
import { NIcon, NSpace, NTag } from 'naive-ui'
import { FingerPrintOutline, ShieldCheckmarkOutline } from '@vicons/ionicons5'

import { cardData, mrzReady } from '@/composables/useCardStore'
</script>

<template>
  <div class="statusbar">
    <NSpace :size="8">
      <NTag size="small" :bordered="false" :type="mrzReady ? 'success' : 'warning'">
        <template #icon><NIcon :component="ShieldCheckmarkOutline" /></template>
        {{ mrzReady ? 'MRZ 3 × 30 in sync' : 'MRZ needs attention' }}
      </NTag>
      <NTag size="small" :bordered="false" type="info">
        <template #icon><NIcon :component="FingerPrintOutline" /></template>
        {{ cardData.documentNumber || 'No document number' }}
      </NTag>
    </NSpace>
  </div>
</template>

<style scoped>
.statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 22px;
  border-top: 1px solid var(--line);
  font-size: 11px;
}

@media (max-width: 680px) {
  .statusbar {
    align-items: flex-start;
    flex-direction: column;
    padding: 10px 14px;
  }
}
</style>
