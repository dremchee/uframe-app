<script setup lang="ts">
import type { ListBlockProps } from '@/core'

const props = defineProps<{
  props: ListBlockProps
  hasChildren?: boolean
}>()
</script>

<template>
  <ul v-if="!props.props.ordered" class="uf-list-block">
    <slot />
    <li v-if="!hasChildren" class="uf-container-placeholder">
      Drop list items inside
    </li>
  </ul>
  <ol v-else class="uf-list-block">
    <slot />
    <li v-if="!hasChildren" class="uf-container-placeholder">
      Drop list items inside
    </li>
  </ol>
</template>
