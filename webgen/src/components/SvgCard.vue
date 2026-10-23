<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { CARD_SVG_MARKUP, updateCardSvg } from '@/lib/cardSvg'
import { registerCardSvg, unregisterCardSvg } from '@/lib/cardDom'
import type { CardData, CardSide } from '@/types/card'

const props = defineProps<{
  side: CardSide
  data: CardData
  mrzLines: readonly string[]
}>()

const host = ref<HTMLDivElement | null>(null)
let svg: SVGSVGElement | null = null

function render(): void {
  if (!svg) return
  updateCardSvg(svg, props.side, props.data, props.mrzLines)
}

onMounted(async () => {
  if (!host.value) return
  host.value.innerHTML = CARD_SVG_MARKUP[props.side]
  svg = host.value.querySelector('svg')
  if (svg) {
    svg.style.display = 'block'
    svg.style.width = '100%'
    svg.style.height = 'auto'
    svg.setAttribute('data-card-side', props.side)
    registerCardSvg(props.side, svg)
  }
  await nextTick()
  render()
  await document.fonts.ready
  render()
})

onBeforeUnmount(() => {
  if (svg) unregisterCardSvg(props.side, svg)
})

watch(
  () => [props.data, props.mrzLines],
  () => render(),
  { deep: true },
)
</script>

<template>
  <div ref="host" class="card-svg-host" />
</template>

<style scoped>
.card-svg-host {
  width: 100%;
  line-height: 0;
}
</style>
