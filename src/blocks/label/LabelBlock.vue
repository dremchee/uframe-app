<script setup lang="ts">
import type { LabelBlockProps } from '@/core'

const props = defineProps<{
  props: LabelBlockProps
  hasChildren?: boolean
}>()
</script>

<template>
  <label class="uf-label-block" :for="props.props.for || undefined">
    {{ props.props.text }}
  </label>
</template>
