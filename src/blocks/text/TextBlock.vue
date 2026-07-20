<script setup lang="ts">
import type { TextBlockProps } from '@/core'

defineProps<{
  props: TextBlockProps
}>()
</script>

<template>
  <!-- Plain text content (the rich-text editor was removed); `whitespace-pre-wrap`
       preserves the author's line breaks without needing v-html. -->
  <div class="uf-text-block whitespace-pre-wrap">
    {{ props.content }}
  </div>
</template>
