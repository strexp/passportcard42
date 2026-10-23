<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NSpin, NText, useMessage } from 'naive-ui'

import EditorSidebar from '@/components/editor/EditorSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import PreviewPane from '@/components/preview/PreviewPane.vue'
import { initializeCardStore, ready } from '@/composables/useCardStore'

const message = useMessage()
const booting = ref(true)

onMounted(async () => {
  try {
    await initializeCardStore()
  } catch (error) {
    console.error(error)
    message.error('The card fonts could not be loaded. A fallback font is being used.')
  } finally {
    booting.value = false
  }
})
</script>

<template>
  <div class="app">
    <AppTopbar />
    <main class="workspace">
      <EditorSidebar />
      <PreviewPane />
    </main>

    <div v-if="!ready || booting" class="boot">
      <NSpin size="large" />
      <NText>Loading card artwork…</NText>
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.workspace {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 390px minmax(0, 1fr);
}

.boot {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: var(--bg);
}

@media (min-width: 1025px) {
  .app {
    height: 100dvh;
    overflow: hidden;
  }
}

@media (max-width: 1100px) {
  .workspace {
    grid-template-columns: 350px minmax(0, 1fr);
  }
}

@media (max-width: 1024px) {
  .app {
    height: auto;
    overflow: visible;
  }

  .workspace {
    display: flex;
    flex-direction: column;
  }
}
</style>
