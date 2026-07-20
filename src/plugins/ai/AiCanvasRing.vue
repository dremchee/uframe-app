<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { useEditorContext } from '@/vue/context/editor-context'
import { loading } from './useAiChat'

const { canvas } = useEditorContext()

// While generating we work over the selection, so tell the canvas to suppress
// its own selection outline (this replaces the old in-canvas `!aiLoading` gate,
// now a generic `busy` signal any plugin can set).
watch(loading, (v) => {
  canvas.busy.value = v
}, { immediate: true })
onBeforeUnmount(() => {
  canvas.busy.value = false
})

// Sit on the selected block's box — or the whole frame when generating a fresh
// page (no selection) — and match its rounding so the ring traces its corners.
const ringStyle = computed(() => {
  const r = canvas.selectionRect.value
  if (!r)
    return { top: '0px', left: '0px', right: '0px', bottom: '0px', borderRadius: '0px' }
  return { top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: canvas.selectionRadius.value ?? '0px' }
})
</script>

<template>
  <!-- AI thinking: animated brand-gradient ring over the target block. -->
  <div v-if="loading" class="uf-ai-thinking absolute z-20 pointer-events-none" :style="ringStyle" />
</template>
