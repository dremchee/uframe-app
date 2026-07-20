<script setup lang="ts">
import type { RadioBlockProps } from '@/core'

const props = defineProps<{
  props: RadioBlockProps
  hasChildren?: boolean
}>()
</script>

<template>
  <label class="uf-radio-block uf-no-click">
    <input
      type="radio"
      :name="props.props.name"
      :value="props.props.value"
      :checked="!!props.props.checked"
      :required="props.props.required || undefined"
    >
    <span>{{ props.props.label }}</span>
  </label>
</template>
