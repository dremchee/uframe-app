<script setup lang="ts">
import type { SelectOptionBlockProps } from '@/core'

const props = defineProps<{
  props: SelectOptionBlockProps
  hasChildren?: boolean
}>()
</script>

<template>
  <option
    class="uf-select-option-block"
    :value="props.props.value"
    :selected="!!props.props.selected"
    :disabled="!!props.props.disabled"
  >
    {{ props.props.label || props.props.value }}
  </option>
</template>
