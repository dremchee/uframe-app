<script setup lang="ts">
import type { SpacerBlockProps } from '@/core'

const props = defineProps<{
  props: SpacerBlockProps
}>()
</script>

<template>
  <div class="uf-spacer-block" :style="{ height: `${props.props.height}px` }" />
</template>
