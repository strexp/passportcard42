<script setup lang="ts">
import { NText } from 'naive-ui'

import SvgCard from '@/components/SvgCard.vue'
import { cardData, mrzResult } from '@/composables/useCardStore'
import { useEditorState } from '@/composables/useEditorState'

const { side, sideLabel, zoom } = useEditorState()
</script>

<template>
  <div class="stage">
    <div class="card-wrap" :style="{ transform: `scale(${zoom})` }">
      <SvgCard
        :data="cardData"
        :mrz-lines="mrzResult.lines"
        side="front"
        class="card-face"
        :class="{ active: side === 'front' }"
      />
      <SvgCard
        :data="cardData"
        :mrz-lines="mrzResult.lines"
        side="back"
        class="card-face"
        :class="{ active: side === 'back' }"
      />
    </div>
    <NText depth="3" class="stage-caption">ID-1 / 85.60 × 53.98 mm / {{ sideLabel }}</NText>
  </div>
</template>

<style scoped>
.stage {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  overflow: auto;
  padding: 32px;
  background:
    radial-gradient(circle at 50% 44%, rgba(216, 243, 106, 0.055), transparent 36%),
    radial-gradient(circle, rgba(255, 255, 255, 0.14) 0.6px, transparent 0.7px) 0 0 / 20px 20px,
    var(--bg);
}

.card-wrap {
  position: relative;
  width: min(100%, 820px);
  transform-origin: center;
  transition: transform 220ms ease;
  filter: drop-shadow(0 28px 42px rgba(0, 0, 0, 0.56));
}

.card-face {
  position: absolute;
  inset: 0;
  width: 100%;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
}

.card-face.active {
  position: relative;
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
}

.stage-caption {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (max-width: 1024px) {
  .stage {
    min-height: 48vh;
    padding: 24px 16px;
  }
}
</style>
