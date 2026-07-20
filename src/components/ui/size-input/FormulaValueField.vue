<script setup lang="ts">
import type { CssUnitOption } from './units'
import Label from '../label/Label.vue'
import SizeInput from './SizeInput.vue'

defineProps<{
  modelValue: string
  label: string
  placeholder?: string
  units: CssUnitOption[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <Label>
    <span>{{ label }}</span>
    <SizeInput
      :model-value="modelValue"
      :placeholder="placeholder"
      :units="units"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </Label>
</template>
