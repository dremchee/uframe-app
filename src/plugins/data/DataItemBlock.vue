<script setup lang="ts">
import type { DataItemBlockProps } from './types'

defineProps<{ props: DataItemBlockProps, hasChildren?: boolean, hasBox?: boolean }>()
</script>

<template>
  <div class="uf-data-item">
    <slot />
    <div v-if="!hasChildren && !hasBox" class="uf-container-placeholder">
      Data Item — drop bound blocks
    </div>
  </div>
</template>
