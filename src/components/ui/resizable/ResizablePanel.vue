<script setup lang="ts">
import type { SplitterPanelEmits, SplitterPanelProps } from 'reka-ui'
import {
  SplitterPanel,

  useForwardPropsEmits,
} from 'reka-ui'
import { computed } from 'vue'

const props = defineProps<SplitterPanelProps & { allowOverflow?: boolean }>()
const emits = defineEmits<SplitterPanelEmits>()

const delegated = computed(() => {
  const { allowOverflow: _, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)
</script>

<template>
  <SplitterPanel v-bind="forwarded" :class="{ 'uf-ui-resizable-panel--allow-overflow': props.allowOverflow }">
    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </SplitterPanel>
</template>
