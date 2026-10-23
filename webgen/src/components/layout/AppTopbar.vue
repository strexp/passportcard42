<script setup lang="ts">
import { computed } from 'vue'
import { NIcon, NText } from 'naive-ui'
import { IdCardOutline } from '@vicons/ionicons5'

import { isSaving, saveError, savedAt } from '@/composables/useCardStore'

const saveStatus = computed(() => {
  if (saveError.value) return saveError.value
  if (isSaving.value) return 'Saving…'
  if (!savedAt.value) return 'Not saved yet'
  return `Saved at ${new Date(savedAt.value).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
})
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <NIcon :component="IdCardOutline" :size="24" />
      <div class="brand-copy">
        <NText strong>passcard42 Studio</NText>
        <NText depth="3">dn42 Passport Card Generator</NText>
      </div>
    </div>
    <NText depth="3" class="save-state">{{ saveStatus }}</NText>
  </header>
</template>

<style scoped>
.topbar {
  height: 64px;
  flex: 0 0 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 22px;
  border-bottom: 1px solid var(--line);
  background: rgba(12, 14, 16, 0.86);
  backdrop-filter: blur(16px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--accent);
}

.brand-copy {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.save-state {
  font-size: 11px;
  white-space: nowrap;
}

@media (max-width: 680px) {
  .topbar {
    padding: 0 14px;
  }

  .save-state {
    display: none;
  }
}
</style>
