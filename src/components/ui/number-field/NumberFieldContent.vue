<script setup lang="ts">
import { cn } from '@/lib/utils'

defineProps<{ class?: string }>()
</script>

<template>
  <!-- Frames the input + the stepper buttons as one bordered control —
       matches the rest of the editor's input styling (h-9, rounded-md, accent
       focus ring delegated to the inner input). -->
  <div
    :class="cn(
      'flex items-center h-9 min-h-9 min-w-0 w-full overflow-hidden rounded-md border border-uf-border bg-uf-panel shadow-xs',
      'focus-within:ring-1 focus-within:ring-uf-accent focus-within:border-uf-accent',
      $props.class,
    )"
  >
    <slot />
  </div>
</template>
