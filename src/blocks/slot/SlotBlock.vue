<script setup lang="ts">
import type { SlotBlockProps } from '@/core'

defineProps<{
  props: SlotBlockProps
  hasChildren?: boolean
  hasBox?: boolean
  slotFallbackLabel?: (name: string) => string
}>()
</script>

<template>
  <div class="uf-div-block" :data-uf-slot="props.name">
    <slot />
    <div v-if="!hasChildren && !hasBox" class="uf-container-placeholder">
      {{ slotFallbackLabel ? slotFallbackLabel(props.name) : `Drop fallback content into ${props.name}` }}
    </div>
  </div>
</template>
