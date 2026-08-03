<script setup lang="ts">
import type { DataListBlockProps } from './types'

defineProps<{ props: DataListBlockProps, hasChildren?: boolean, hasBox?: boolean }>()
</script>

<template>
  <div class="uf-data-list">
    <slot />
    <div v-if="!hasChildren && !hasBox" class="uf-container-placeholder">
      Data List — drop the item template
    </div>
  </div>
</template>
