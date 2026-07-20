<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: string
}>()

const classes = computed(() =>
  cn(
    'uf-ui-input-group group/input-group flex h-9 w-full min-w-0 items-center rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow]',
    'focus-within:border-uf-accent focus-within:ring-1 focus-within:ring-uf-accent',
    props.class,
  ),
)
</script>

<template>
  <div data-slot="input-group" :class="classes">
    <slot />
  </div>
</template>
