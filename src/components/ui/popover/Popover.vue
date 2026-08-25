<script setup lang="ts">
import type { PopoverRootEmits, PopoverRootProps } from 'reka-ui'
import { useVModel } from '@vueuse/core'
import { PopoverRoot, useForwardProps } from 'reka-ui'
import { useDismissOnCanvasFocus } from '@/vue/composables/ui'

const props = defineProps<PopoverRootProps>()
const emits = defineEmits<PopoverRootEmits>()
const forwarded = useForwardProps(props)
const open = useVModel(props, 'open', emits, {
  passive: true,
  defaultValue: props.defaultOpen ?? false,
})

// A click in the canvas iframe blurs the editor window but cannot trigger
// reka's same-document outside handlers. Close consistently in that case.
useDismissOnCanvasFocus(open)
</script>

<template>
  <PopoverRoot v-bind="forwarded" v-model:open="open">
    <slot />
  </PopoverRoot>
</template>
