<script setup lang="ts">
import type { DivBlockProps } from '@/core'

defineProps<{
  props: DivBlockProps
  hasChildren?: boolean
  hasBox?: boolean
}>()
</script>

<template>
  <div class="uf-div-block">
    <slot />
    <div v-if="!hasChildren && !hasBox" class="uf-container-placeholder">
      Drop blocks inside
    </div>
  </div>
</template>
