<script setup lang="ts">
import type { EmbedBlockProps } from '@/core'
import { computed } from 'vue'
import { useUntrustedEmbeds } from '@/vue/context/embed-trust'

// The block has mutually exclusive root elements. Vue cannot automatically
// fall through the public renderer's class/id attributes in that shape, so
// forward them explicitly on every branch.
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  props: EmbedBlockProps
  hasChildren?: boolean
}>()

// In an untrusted document the author HTML is isolated in a sandboxed,
// cross-origin iframe (no allow-same-origin) so it can't reach the editor's
// origin / storage. Otherwise it renders verbatim (trusted, like rich text).
const untrusted = useUntrustedEmbeds()
const isolate = computed(() => untrusted() && !!props.props.html)
</script>

<template>
  <iframe
    v-if="isolate"
    v-bind="$attrs"
    class="uf-embed-block uf-embed-frame uf-no-click"
    sandbox="allow-scripts allow-popups allow-forms"
    :srcdoc="props.props.html"
  />
  <!-- Trust boundary: the embed HTML is editor user-authored content; treated
       as trusted, same as Tiptap-authored rich text. Renders verbatim. -->
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div v-else-if="props.props.html" v-bind="$attrs" class="uf-embed-block uf-no-click" v-html="props.props.html" />
  <div v-else v-bind="$attrs" class="uf-embed-block uf-container-placeholder">
    Empty embed — paste HTML in the Content tab
  </div>
</template>
