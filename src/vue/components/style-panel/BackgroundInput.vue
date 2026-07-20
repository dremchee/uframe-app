<script setup lang="ts">
import type { BackgroundStyles } from '@/core'
import BackgroundPicker from './BackgroundPicker.vue'

const props = defineProps<{
  modelValue: BackgroundStyles
}>()

const emit = defineEmits<{
  'update:modelValue': [patch: Partial<BackgroundStyles>]
}>()
</script>

<template>
  <!-- The complete editor belongs in the docked Style panel: a popover hides
       active controls and is especially awkward while editing a gradient. -->
  <BackgroundPicker
    :model-value="props.modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
