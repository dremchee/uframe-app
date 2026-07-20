<script setup lang="ts">
import type { SliderRootEmits, SliderRootProps } from 'reka-ui'
import {
  SliderRange,
  SliderRoot,

  SliderThumb,
  SliderTrack,
  useForwardPropsEmits,
} from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<SliderRootProps & { class?: string }>()
const emits = defineEmits<SliderRootEmits>()

const delegated = computed(() => {
  const { class: _class, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)
</script>

<template>
  <SliderRoot
    v-bind="forwarded"
    :class="cn('relative flex w-full touch-none select-none items-center', props.class)"
  >
    <SliderTrack class="relative h-1 w-full grow overflow-hidden rounded-full bg-uf-border">
      <SliderRange class="absolute h-full rounded-full bg-uf-accent" />
    </SliderTrack>
    <SliderThumb
      v-for="(_, index) in (props.modelValue ?? [0])"
      :key="index"
      class="block size-3.5 rounded-full border-2 border-white bg-uf-accent shadow ring-1 ring-uf-border focus:outline-none focus-visible:ring-2 focus-visible:ring-uf-accent"
    />
  </SliderRoot>
</template>
