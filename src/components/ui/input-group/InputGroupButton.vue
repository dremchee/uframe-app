<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: string
}>()

const classes = computed(() =>
  cn(
    'uf-ui-input-group-button grid size-6 shrink-0 cursor-pointer place-items-center rounded-sm text-uf-muted transition-colors',
    'hover:bg-uf-panel-muted hover:text-uf-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uf-accent',
    props.class,
  ),
)
</script>

<template>
  <button type="button" :class="classes">
    <slot />
  </button>
</template>
