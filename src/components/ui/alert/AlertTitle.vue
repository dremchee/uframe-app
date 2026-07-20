<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: string }>()

const classes = computed(() =>
  cn('uf-ui-alert-title col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight', props.class),
)
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
