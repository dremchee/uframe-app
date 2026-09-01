<script setup lang="ts">
import type { TextBlockProps } from '@/core'

defineProps<{
  props: TextBlockProps
}>()
</script>

<template>
  <!-- Plain text content (the rich-text editor was removed); the inline
       `white-space` preserves the author's line breaks without needing v-html.
       It is inline rather than a class because the canvas iframe loads only
       page-reset.css + page-frame.css — no Tailwind — and because the export
       emits the very same declaration. -->
  <div class="uf-text-block" style="white-space: pre-wrap">
    {{ props.content }}
  </div>
</template>
