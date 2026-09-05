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
  padding: '4px',
  alignItems: 'stretch',
  justifyContent: 'center',
}))
const count = computed(() => props.preset.style?.display === 'grid'
  ? Math.max(1, props.preset.children?.length || 3) * 2
  : props.preset.children?.length || (props.preset.style?.display === 'flex' ? 3 : 1))
</script>

<template>
  <div class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md border border-uf-border bg-uf-panel-muted" aria-hidden="true">
    <div v-if="preset.id === 'section'" class="flex h-6 w-full items-center justify-center border-y border-uf-accent/40 bg-uf-accent/10">
      <div class="h-3 w-6 rounded-[2px] border border-uf-accent/50 bg-uf-accent/20" />
    </div>
    <div v-else-if="preset.id === 'container'" class="h-7 w-6 rounded-[2px] border border-dashed border-uf-accent/50 bg-uf-accent/10 p-1">
      <div class="h-full rounded-[1px] bg-uf-accent/20" />
    </div>
    <div v-else class="size-full" :style="layout">
      <div
        v-for="index in count"
        :key="index"
        class="min-h-1 min-w-1 flex-1 rounded-[2px] border border-uf-accent/40 bg-uf-accent/15"
        :style="preset.style?.flexWrap === 'wrap' ? { flex: '0 0 40%' } : undefined"
      />
    </div>
  </div>
</template>
