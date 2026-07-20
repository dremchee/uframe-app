<script setup lang="ts">
import type { TabsTriggerProps } from 'reka-ui'
import { TabsTrigger, useForwardProps } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<
  TabsTriggerProps & {
    class?: string
  }
>()

const forwarded = useForwardProps(props)
const classes = computed(() =>
  cn(
    'uf-ui-tabs-trigger',
    'inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 py-1',
    'text-sm font-medium cursor-pointer transition-all',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
    'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs',
    props.class,
  ),
)
</script>

<template>
  <TabsTrigger v-bind="forwarded" :class="classes">
    <slot />
  </TabsTrigger>
</template>
