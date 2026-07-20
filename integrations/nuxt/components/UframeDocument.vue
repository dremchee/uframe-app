<script setup lang="ts">
import type { PageDocument, ResolveContext } from 'uframe/core'
import type { Component } from 'vue'
import { nameUnnamedStyles, serializeDocumentStyles } from 'uframe/core'
import { computed } from 'vue'
import { pageBaseCss } from '../assets/page-base'
import { useUframeRegistry } from '../composables/useUframeRegistry'
// Render-function component (no template), so it isn't auto-imported — pull it in.
import UframeBlock from './UframeBlock'

// Component-based renderer: walks the document with recursive <UframeBlock>s.
// It hydrates, stays reactive, and emits only semantic elements plus classes
// authored in the document — never editor wrapper classes.
const props = defineProps<{
  document: PageDocument
  /** Data the document's bindings / Data Lists need (see `collectDataRequirements`). */
  context?: ResolveContext
  /** Optional per-type component overrides, e.g. `{ button: MyButton }`. */
  components?: Record<string, Component>
}>()

const registry = useUframeRegistry()
const renderedDocument = computed<PageDocument>(() => {
  const result = nameUnnamedStyles(props.document.blocks, props.document.symbols, props.document.styles ?? {})
  return result.changed
    ? { ...props.document, blocks: result.blocks, symbols: result.symbols, styles: result.styles }
    : props.document
})

// Public CSS is only the uframe page baseline plus document-owned rules.
// `collectBlockCss` is deliberately excluded: it targets editor `uf-*` block
// classes, which the public renderer never emits.
const css = computed(() => [
  pageBaseCss,
  serializeDocumentStyles(renderedDocument.value),
].filter(Boolean).join('\n'))

useHead(() => ({
  title: renderedDocument.value.title,
  // Unhead treats `children` as an attribute in a client-rendered style tag;
  // `innerHTML` writes the stylesheet content so browsers actually apply it.
  style: [{ key: 'uframe-page', innerHTML: css.value }],
}))
</script>

<template>
  <UframeBlock
    v-for="block in renderedDocument.blocks"
    :key="block.id"
    :block="block"
    :registry="registry"
    :symbols="renderedDocument.symbols"
    :context="context"
    :components="components"
  />
</template>
