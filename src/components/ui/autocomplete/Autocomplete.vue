<script setup lang="ts">
import type { AutocompleteRootEmits, AutocompleteRootProps } from 'reka-ui'
import { useVModel } from '@vueuse/core'
import { AutocompleteRoot, useForwardProps } from 'reka-ui'
import { computed, useTemplateRef } from 'vue'
import { useDismissOnCanvasFocus } from '@/vue/composables/ui'

/**
 * Free-text input + suggestion list on reka's Autocomplete: `modelValue` IS
 * the typed text (unlike Combobox, whose model is the selection), which fits
 * fields where the text itself is the value and suggestions are optional.
 */
const props = defineProps<AutocompleteRootProps>()
const emit = defineEmits<AutocompleteRootEmits>()
const forwarded = useForwardProps(props)
const open = useVModel(props, 'open', emit, {
  passive: true,
  defaultValue: props.defaultOpen ?? false,
})
const model = useVModel(props, 'modelValue', emit, {
  passive: true,
})
useDismissOnCanvasFocus(open)

// Surface reka's highlight state: a consumer deciding what Enter means
// (pick the highlighted row vs submit the typed text) needs to see it.
const root = useTemplateRef<{ highlightedElement?: HTMLElement }>('root')
defineExpose({
  highlightedElement: computed(() => root.value?.highlightedElement),
})
</script>

<template>
  <AutocompleteRoot ref="root" v-bind="forwarded" v-model="model" v-model:open="open">
    <slot />
  </AutocompleteRoot>
</template>
