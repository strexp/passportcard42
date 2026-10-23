<script setup lang="ts">
import CardStage from '@/components/preview/CardStage.vue'
import PreviewStatusBar from '@/components/preview/PreviewStatusBar.vue'
import PreviewToolbar from '@/components/preview/PreviewToolbar.vue'
</script>

<template>
  <section class="preview">
    <PreviewToolbar />
    <CardStage />
    <PreviewStatusBar />
  </section>
</template>

<style scoped>
.preview {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (max-width: 1024px) {
  .preview {
    order: -1;
    overflow: visible;
  }
}
</style>
