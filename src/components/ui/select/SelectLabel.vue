<script setup lang="ts">
import { SelectLabel } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: string }>()

const classes = computed(() => cn(
  'px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-uf-muted',
  props.class,
))
</script>

<template>
  <SelectLabel :class="classes">
    <slot />
  </SelectLabel>
</template>
