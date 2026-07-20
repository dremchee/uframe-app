<script setup lang="ts">
import type { ContainerBlockProps } from '@/core'

defineProps<{
  props: ContainerBlockProps
  hasChildren?: boolean
  hasBox?: boolean
}>()
</script>

<template>
  <div class="uf-container-block">
    <slot />
    <div v-if="!hasChildren && !hasBox" class="uf-container-placeholder">
      Drop blocks inside this container
    </div>
  </div>
</template>
