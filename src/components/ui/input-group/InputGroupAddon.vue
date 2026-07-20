<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  align?: 'inline-start' | 'inline-end'
  class?: string
}>(), {
  align: 'inline-start',
})

const classes = computed(() =>
  cn(
    'uf-ui-input-group-addon flex shrink-0 items-center gap-0.5',
    props.align === 'inline-end' ? 'order-last pr-1' : 'pl-1',
    props.class,
  ),
)
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
