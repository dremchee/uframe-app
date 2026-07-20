<script setup lang="ts">
import type { SelectItemProps } from 'reka-ui'
import { Check } from '@lucide/vue'
import {
  SelectItem,
  SelectItemIndicator,

  SelectItemText,
  useForwardProps,
} from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<SelectItemProps & {
  class?: string
}>()

const forwarded = useForwardProps(props)
const classes = computed(() => cn(
  'uf-ui-select-item',
  'relative flex w-full select-none items-center',
  'rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none cursor-pointer',
  'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  props.class,
))
</script>

<template>
  <SelectItem v-bind="forwarded" :class="classes">
    <span class="absolute right-2 flex size-3.5 items-center justify-center">
      <SelectItemIndicator>
        <Check class="size-4" />
      </SelectItemIndicator>
    </span>
    <SelectItemText class="flex-1 min-w-0">
      <slot />
    </SelectItemText>
  </SelectItem>
</template>
