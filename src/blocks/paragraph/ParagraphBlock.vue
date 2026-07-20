<script setup lang="ts">
import type { ParagraphBlockProps } from '@/core'

const props = defineProps<{
  props: ParagraphBlockProps
  hasChildren?: boolean
}>()
</script>

<template>
  <p class="uf-paragraph-block">
    {{ props.props.content }}
  </p>
</template>
