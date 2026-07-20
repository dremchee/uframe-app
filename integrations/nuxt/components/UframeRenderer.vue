<script setup lang="ts">
import type { PageDocument, ResolveContext } from 'uframe/core'
import { renderDocumentToFragment, resolveDocument } from 'uframe/core'
import { computed } from 'vue'
import { pageBaseCss } from '../assets/page-base'
import { useUframeRegistry } from '../composables/useUframeRegistry'

const props = defineProps<{
  /** The template to render (as authored in the uframe editor). */
  document: PageDocument
  /**
   * Data the document's bindings / Data Lists need, already fetched by the
   * caller (see `collectDataRequirements`). Omit for a fully static template.
   */
  context?: ResolveContext
}>()

const registry = useUframeRegistry()

// 1. resolveDocument swaps bound props in and expands Data Lists per row into a
//    static tree. 2. renderDocumentToFragment turns that tree into clean HTML +
//    its scoped CSS. Both are pure, so SSR output and client hydration match.
const rendered = computed(() => {
  const resolved = resolveDocument(props.document, props.context ?? {})
  const fragment = renderDocumentToFragment(resolved, registry)
  return {
    title: resolved.title,
    html: fragment.html,
    css: [pageBaseCss, fragment.css].filter(Boolean).join('\n'),
  }
})

// Inject the page's title + stylesheet into <head> on the server.
useHead(() => ({
  title: rendered.value.title,
  style: [{ key: 'uframe-page', innerHTML: rendered.value.css }],
}))
</script>

<template>
  <!-- The resolved template markup. `renderHtml` produces the same clean output
       the editor's HTML export does — no editor wrappers or data-attributes. -->
  <div class="uframe-page" v-html="rendered.html" />
</template>
