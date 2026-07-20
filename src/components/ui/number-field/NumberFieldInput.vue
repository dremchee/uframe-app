<script setup lang="ts">
import { NumberFieldInput } from 'reka-ui'
import { cn } from '@/lib/utils'

defineProps<{ class?: string }>()
</script>

<template>
  <NumberFieldInput
    :class="cn(
      'min-w-0 flex-1 h-full px-2.5 py-1 bg-transparent text-uf-text text-sm tabular-nums',
      'outline-none placeholder:text-uf-muted',
      $props.class,
    )"
  />
</template>
