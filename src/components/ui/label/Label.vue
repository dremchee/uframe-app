<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: string
}>()

const classes = computed(() => cn(
  'uf-ui-label',
  // Wrapper keeps the base text colour/size so controls (Input, Select…) inherit
  // it. The label text itself is a direct <span>, styled to the panel-wide field
  // convention (small, uppercase, muted) — scoped to >span so `uppercase` never
  // leaks into the input value.
  'grid gap-1.5 text-sm font-medium leading-none text-foreground',
  '[&>span]:text-uf-muted [&>span]:text-[11px] [&>span]:font-semibold [&>span]:uppercase [&>span]:tracking-wider [&>span]:leading-none',
  props.class,
))
</script>

<template>
  <label :class="classes">
    <slot />
  </label>
</template>
