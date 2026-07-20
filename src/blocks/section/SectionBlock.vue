<script setup lang="ts">
import type { SectionBlockProps } from '@/core'

defineProps<{
  props: SectionBlockProps
  hasChildren?: boolean
  hasBox?: boolean
}>()
</script>

<template>
  <section class="uf-section-block">
    <slot />
    <div v-if="!hasChildren && !hasBox" class="uf-container-placeholder">
      Drop blocks inside this section
    </div>
  </section>
</template>
