<script setup lang="ts">
import type { DividerBlockProps } from '@/core'

defineProps<{
  props: DividerBlockProps
  hasChildren?: boolean
}>()
</script>

<template>
  <hr class="uf-divider-block">
</template>
