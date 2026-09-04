<script setup lang="ts">
import type { PlaceholderBlockProps } from '@/core'
import { computed } from 'vue'
import { placeholderClasses, placeholderLabel, placeholderRatioValue } from '@/blocks/placeholder/render'

const props = defineProps<{
  props: PlaceholderBlockProps
}>()

const classes = computed(() => placeholderClasses(props.props))
const label = computed(() => placeholderLabel(props.props))
// Bound as `undefined` (not an empty object) when auto, so no style attribute
// is emitted and the canvas root matches the export root exactly.
const style = computed(() => {
  const ratio = placeholderRatioValue(props.props)
  return ratio ? { aspectRatio: ratio } : undefined
})
</script>

<template>
  <div :class="classes" :style="style">
    <span v-if="label" class="uf-placeholder__label">{{ label }}</span>
  </div>
</template>
