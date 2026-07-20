<script setup lang="ts">
import type { PopoverTriggerProps } from 'reka-ui'
import { PopoverTrigger, useForwardProps } from 'reka-ui'
import { computed } from 'vue'

const props = defineProps<PopoverTriggerProps & { class?: string }>()

const delegated = computed(() => {
  const { class: _class, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
</script>

<template>
  <PopoverTrigger v-bind="forwarded" :class="props.class">
    <slot />
  </PopoverTrigger>
</template>
