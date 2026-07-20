<script setup lang="ts">
import type { CssUnitOption } from '@/components/ui'
import { computed } from 'vue'
import { parseLength, SizeInput, Slider } from '@/components/ui'

/**
 * One labelled control row used inside the filter / shadow editors:
 * `LABEL ──slider── [SizeInput]`. The slider and the SizeInput are bound to the
 * same numeric value; the unit is fixed per field (the parent says which), so
 * the SizeInput's unit dropdown is locked to that single option.
 */
const props = defineProps<{
  label?: string
  modelValue: number
  min?: number
  max?: number
  step?: number
  unit?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const unit = computed(() => props.unit ?? 'px')
const units = computed<CssUnitOption[]>(() => [{ value: unit.value, label: unit.value }])
const sizeValue = computed(() => `${props.modelValue}${unit.value}`)

function onSlider(value: number[] | undefined) {
  if (value && value.length)
    emit('update:modelValue', value[0])
}

function onSize(value: string) {
  const parsed = parseLength(value)
  const n = parsed ? Number.parseFloat(parsed.number) : Number.NaN
  emit('update:modelValue', Number.isFinite(n) ? n : 0)
}
</script>

<template>
  <div class="flex items-center gap-2.5">
    <span v-if="label" class="w-12 shrink-0 truncate text-[11px] font-semibold uppercase tracking-wider text-uf-muted">{{ label }}</span>
    <Slider
      class="flex-1"
      :model-value="[props.modelValue]"
      :min="props.min"
      :max="props.max"
      :step="props.step ?? 1"
      @update:model-value="onSlider"
    />
    <SizeInput
      class="w-22 shrink-0"
      :model-value="sizeValue"
      :units="units"
      :default-unit="unit"
      :min="props.min"
      @update:model-value="onSize"
    />
  </div>
</template>
