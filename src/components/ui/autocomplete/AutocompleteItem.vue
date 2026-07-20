<script setup lang="ts">
import type { ComboboxItemEmits, ComboboxItemProps } from 'reka-ui'
import { AutocompleteItem, useForwardPropsEmits } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<ComboboxItemProps & { class?: string }>()
const emit = defineEmits<ComboboxItemEmits>()

const forwarded = useForwardPropsEmits(props, emit)
const classes = computed(() => cn(
  'uf-ui-autocomplete-item',
  'flex h-8 w-full select-none items-center px-3 text-[13px] leading-tight text-uf-text outline-none cursor-pointer',
  'data-[highlighted]:bg-uf-panel-muted',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  props.class,
))
</script>

<template>
  <AutocompleteItem v-bind="forwarded" :class="classes">
    <slot />
  </AutocompleteItem>
</template>
