<script setup lang="ts">
import { cn } from '@/lib/utils'

defineProps<{ class?: string }>()
</script>

<template>
  <!-- Vertically stacked Increment/Decrement column — narrow strip on the
       right side of NumberFieldContent. The border-l divides it from the
       input area. -->
  <div
    :class="cn(
      'flex flex-col shrink-0 self-stretch w-5 border-l border-uf-border',
      $props.class,
    )"
  >
    <slot />
  </div>
</template>
