<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  modelValue?: string | number
  class?: string
  type?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const classes = computed(() =>
  cn(
    'uf-ui-input',
    // min-w-0: HTML <input> defaults to size=20 / min-width: auto, which
    // prevents shrinking below ~150px and breaks layout in narrow
    // grid/flex cells (Border T/R/B/L, Radius TL/TR/BL/BR). Resetting
    // min-width unblocks `w-full` to actually fill the cell.
    'flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-uf-accent focus-visible:border-uf-accent',
    'disabled:cursor-not-allowed disabled:opacity-50',
    props.class,
  ),
)

const input = useTemplateRef<HTMLInputElement>('input')

function focus() {
  input.value?.focus()
}

defineExpose({ focus })

function updateValue(event: Event) {
  const input = event.target as HTMLInputElement
  emit(
    'update:modelValue',
    props.type === 'number' ? input.valueAsNumber : input.value,
  )
}
</script>

<template>
  <input
    ref="input"
    :class="classes"
    :type="type"
    :value="modelValue"
    @input="updateValue"
  >
</template>
