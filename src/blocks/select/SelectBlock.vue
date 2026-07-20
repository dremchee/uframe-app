<script setup lang="ts">
import type { SelectBlockProps } from '@/core'

const props = defineProps<{
  props: SelectBlockProps
  hasChildren?: boolean
  selectOptionFallbackLabel?: string
}>()
</script>

<template>
  <select
    class="uf-select-block uf-no-click"
    :name="props.props.name"
    :required="props.props.required || undefined"
    :disabled="props.props.disabled || undefined"
  >
    <slot />
    <option v-if="!hasChildren" disabled value="">
      {{ selectOptionFallbackLabel ?? 'Add Select Option children' }}
    </option>
  </select>
</template>
