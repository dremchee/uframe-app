<script setup lang="ts">
import type { ListItemBlockProps } from '@/core'

defineProps<{
  props: ListItemBlockProps
  hasChildren?: boolean
}>()
</script>

<template>
  <li class="uf-list-item-block">
    <slot />
    <span v-if="!hasChildren" class="uf-container-placeholder">
      Drop content inside
    </span>
  </li>
</template>
