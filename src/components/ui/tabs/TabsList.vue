<script setup lang="ts">
import type { TabsListProps } from 'reka-ui'
import { TabsList, useForwardProps } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<TabsListProps & {
  class?: string
}>()

const forwarded = useForwardProps(props)
const classes = computed(() => cn(
  'uf-ui-tabs-list',
  'grid grid-cols-2 gap-1 w-full p-1',
  'rounded-lg bg-muted text-muted-foreground',
  props.class,
))
</script>

<template>
  <TabsList v-bind="forwarded" :class="classes">
    <slot />
  </TabsList>
</template>
