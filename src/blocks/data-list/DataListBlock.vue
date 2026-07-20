<script setup lang="ts">
import type { DataListBlockProps } from '@/core'

// On the canvas the list shows its item template ONCE; real repetition happens
// on the frontend via `resolveDocument`. `setDataContext` sample data drives a
// richer preview later (binding UI).
defineProps<{
  props: DataListBlockProps
  hasChildren?: boolean
  hasBox?: boolean
}>()
</script>

<template>
  <div class="uf-data-list">
    <slot />
    <div v-if="!hasChildren && !hasBox" class="uf-container-placeholder">
      Data List — drop the item template
    </div>
  </div>
</template>
