<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: string }>()

const classes = computed(() => cn('uf-ui-card-title font-semibold leading-none tracking-tight', props.class))
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
