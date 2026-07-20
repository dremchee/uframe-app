<script setup lang="ts">
import type { NumberFieldRootEmits, NumberFieldRootProps } from 'reka-ui'
import {
  NumberFieldRoot,

  useForwardPropsEmits,
} from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

// Default `disableWheelChange` to true here: Vue's Boolean-prop casting
// would otherwise coerce an omitted prop to `false`, leaving wheel-scrub
// enabled (which produces z-index=-23-by-accident moments). Steppers and
// keyboard arrows still work; pass :disable-wheel-change="false" on a
// specific NumberField to opt back in.
const props = withDefaults(
  defineProps<NumberFieldRootProps & { class?: string }>(),
  { disableWheelChange: true },
)
const emit = defineEmits<NumberFieldRootEmits>()

const delegated = computed(() => {
  const { class: _, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emit)
</script>

<template>
  <NumberFieldRoot
    v-bind="forwarded"
    :class="cn('grid min-w-0 w-full gap-1.5', props.class)"
  >
    <slot />
  </NumberFieldRoot>
</template>
