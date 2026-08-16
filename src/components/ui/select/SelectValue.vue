<script setup lang="ts">
import type { SelectValueProps } from 'reka-ui'
import { SelectValue } from 'reka-ui'

defineProps<SelectValueProps>()
</script>

<template>
  <SelectValue v-bind="$props" class="min-w-0 flex-1 truncate text-left">
    <slot />
  </SelectValue>
</template>
