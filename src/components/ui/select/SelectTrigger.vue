<script setup lang="ts">
import type { SelectTriggerProps } from 'reka-ui'
import { ChevronDown } from '@lucide/vue'
import {
  SelectIcon,
  SelectTrigger,

  useForwardProps,
} from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<
  SelectTriggerProps & {
    class?: string
  }
>()

const forwarded = useForwardProps(props)
const classes = computed(() =>
  cn(
    'uf-ui-select-trigger',
    'flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap',
    'rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs',
    'cursor-pointer [&>span]:line-clamp-1',
    'placeholder:text-muted-foreground',
    'focus:outline-none focus:ring-1 focus:ring-uf-accent focus:border-uf-accent',
    'disabled:cursor-not-allowed disabled:opacity-50',
    props.class,
  ),
)
</script>

<template>
  <SelectTrigger v-bind="forwarded" :class="classes">
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="size-4 opacity-50 shrink-0" />
    </SelectIcon>
  </SelectTrigger>
</template>
