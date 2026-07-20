<script setup lang="ts">
import type { TabsContentProps } from 'reka-ui'
import { TabsContent, useForwardProps } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<TabsContentProps & {
  class?: string
}>()

const forwarded = useForwardProps(props)
// Consumer layouts commonly add `flex`; explicitly hide inactive panes so that
// utility cannot override the browser's default `[hidden]` display and leave a
// spacer before the active tab.
const classes = computed(() => cn(
  'uf-ui-tabs-content min-h-0 outline-none data-[state=inactive]:hidden',
  props.class,
))
</script>

<template>
  <TabsContent v-bind="forwarded" :class="classes">
    <slot />
  </TabsContent>
</template>
