<script setup lang="ts">
import type { ListBlockProps } from '@/core'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  props: ListBlockProps
  hasChildren?: boolean
}>()
</script>

<template>
  <ul v-if="!props.props.ordered" v-bind="$attrs" class="uf-list-block">
    <slot />
    <li v-if="!hasChildren" class="uf-container-placeholder">
      Drop list items inside
    </li>
  </ul>
  <ol v-else v-bind="$attrs" class="uf-list-block">
    <slot />
    <li v-if="!hasChildren" class="uf-container-placeholder">
      Drop list items inside
    </li>
  </ol>
</template>
