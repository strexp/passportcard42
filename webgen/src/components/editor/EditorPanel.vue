<script setup lang="ts">
import { NScrollbar } from 'naive-ui'
</script>

<template>
  <NScrollbar class="pane-scroll">
    <div class="pane">
      <slot />
    </div>
  </NScrollbar>
</template>

<style scoped>
.pane-scroll {
  max-height: calc(100dvh - 238px);
}

.pane {
  padding: 16px 20px 22px;
}

.pane :deep(.hint) {
  display: block;
  font-size: 11px;
  line-height: 1.55;
}

.pane :deep(.n-form-item) {
  margin-bottom: 14px;
}

.pane :deep(.n-grid .n-form-item) {
  margin-bottom: 0;
}

.pane :deep(.full-width) {
  width: 100%;
}

.pane :deep(.warning-list) {
  margin: 0;
  padding-left: 18px;
}

.pane :deep(.panel-actions) {
  margin-top: 10px;
}

@media (max-width: 1024px) {
  .pane-scroll {
    max-height: none;
  }
}

@media (max-width: 680px) {
  .pane {
    padding: 14px;
  }
}
</style>
