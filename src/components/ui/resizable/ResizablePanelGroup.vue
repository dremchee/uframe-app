<script setup lang="ts">
import type { SplitterGroupEmits, SplitterGroupProps } from 'reka-ui'
import {
  SplitterGroup,

  useForwardPropsEmits,
} from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<SplitterGroupProps & { class?: string }>()
const emits = defineEmits<SplitterGroupEmits>()

const delegated = computed(() => {
  const { class: _, ...rest } = props
  return rest
})

const forwarded = useForwardPropsEmits(delegated, emits)

const classes = computed(() =>
  cn(
    'uf-ui-resizable-group flex h-full w-full data-[orientation=vertical]:flex-col',
    props.class,
  ),
)
</script>

<template>
  <SplitterGroup v-bind="forwarded" :class="classes">
    <slot />
  </SplitterGroup>
</template>
