<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: string
}>()

const classes = computed(() => cn('uf-ui-scroll-area min-h-0 overflow-auto scrollbar-hide', props.class))
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
