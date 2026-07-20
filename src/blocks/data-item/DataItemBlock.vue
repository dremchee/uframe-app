<script setup lang="ts">
import type { DataItemBlockProps } from '@/core'

// Binds its children to a single record (a singleton or a relation). Children
// render once; their bindings resolve against `item.*` on the frontend.
defineProps<{
  props: DataItemBlockProps
  hasChildren?: boolean
  hasBox?: boolean
}>()
</script>

<template>
  <div class="uf-data-item">
    <slot />
    <div v-if="!hasChildren && !hasBox" class="uf-container-placeholder">
      Data Item — drop bound blocks
    </div>
  </div>
</template>
