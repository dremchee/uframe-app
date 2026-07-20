<script setup lang="ts">
import type { CheckboxBlockProps } from '@/core'

const props = defineProps<{
  props: CheckboxBlockProps
  hasChildren?: boolean
}>()
</script>

<template>
  <label class="uf-checkbox-block uf-no-click">
    <input
      type="checkbox"
      :name="props.props.name"
      :value="props.props.value ?? 'on'"
      :checked="!!props.props.checked"
      :required="props.props.required || undefined"
    >
    <span>{{ props.props.label }}</span>
  </label>
</template>
