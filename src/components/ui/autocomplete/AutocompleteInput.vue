<script setup lang="ts">
import type { AutocompleteInputProps } from 'reka-ui'
import { AutocompleteInput, useForwardProps } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

// Same face as the plain ui Input, but wired into the Autocomplete root:
// typing opens + filters the list, ↑/↓ move the highlight, Enter picks it.
const props = defineProps<AutocompleteInputProps & { class?: string }>()

const forwarded = useForwardProps(props)
const classes = computed(() =>
  cn(
    'uf-ui-input',
    'flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-uf-accent focus-visible:border-uf-accent',
    'disabled:cursor-not-allowed disabled:opacity-50',
    props.class,
  ),
)
</script>

<template>
  <AutocompleteInput v-bind="forwarded" :class="classes" />
</template>
