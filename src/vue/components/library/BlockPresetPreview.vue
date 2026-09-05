<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { BlockPreset } from '@/core'
import { computed } from 'vue'

const props = defineProps<{ preset: BlockPreset }>()
// A miniature live layout using the preset's layout properties, with sample
// children so empty structural presets still demonstrate their arrangement.
const layout = computed<CSSProperties>(() => ({
  display: props.preset.style?.display ?? 'flex',
  flexDirection: props.preset.style?.flexDirection ?? 'column',
  flexWrap: props.preset.style?.flexWrap,
  gridTemplateColumns: props.preset.style?.gridTemplateColumns,
  gap: '3px',
  padding: props.preset.id === 'section' ? '7px 4px' : '4px',
  alignItems: 'stretch',
  justifyContent: 'center',
}))
const count = computed(() => props.preset.children?.length || (props.preset.style?.display === 'flex' ? 3 : 1))
</script>

<template>
  <div class="h-10 w-14 shrink-0 overflow-hidden rounded-md border border-uf-border bg-uf-panel-muted" :style="layout" aria-hidden="true">
    <div
      v-for="index in count"
      :key="index"
      class="min-h-1 min-w-1 flex-1 rounded-[2px] border border-uf-accent/40 bg-uf-accent/15"
      :style="preset.style?.flexWrap === 'wrap' ? { flexBasis: '35%' } : undefined"
    />
  </div>
</template>
