<script setup lang="ts">
import type { VNode } from 'vue'
import type { BlockRegistry, PageDocument } from '@/core'
import { computed, h, nextTick, onBeforeUnmount, render, shallowRef, watch } from 'vue'
import { defaultBlockDefinitions } from '@/blocks'
import { createBlockRegistry, renderFontHead } from '@/core'
import { pageFrameStyles } from '@/styles/page-frame'
import CanvasFrameDocument from '@/vue/components/CanvasFrameDocument.vue'
import { useUframeI18n } from '@/vue/i18n'

const props = withDefaults(defineProps<{
  document: PageDocument
  blocks?: BlockRegistry
  /**
   * Active viewport width in px (null = full width). Constraining the iframe
   * is what makes `@media (max-width: …)` rules fire — the media queries
   * evaluate against the iframe's own width, so a 390px frame renders the
   * mobile breakpoint exactly as the published page would.
   */
  width?: number | null
  /** Render embed blocks in a sandboxed iframe (untrusted document). */
  untrustedEmbeds?: boolean
}>(), {
  blocks: () => createBlockRegistry(defaultBlockDefinitions),
  width: null,
  untrustedEmbeds: false,
})
const i18n = useUframeI18n()
const { t } = i18n

const widthStyle = computed(() =>
  props.width != null ? `min(100%, ${props.width}px)` : '100%',
)

const frameRef = shallowRef<HTMLIFrameElement | null>(null)
const mountEl = shallowRef<HTMLElement | null>(null)

function getFrameDocument() {
  return frameRef.value?.contentDocument ?? null
}

function bootstrapFrame() {
  const doc = getFrameDocument()
  if (!doc)
    return

  doc.open()
  doc.write(`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${renderFontHead(props.document.fonts)}
        <style>${pageFrameStyles}</style>
      </head>
      <body></body>
    </html>`)
  doc.close()
  mountEl.value = doc.body
  renderFrame()
}

function renderFrame() {
  if (!mountEl.value)
    return

  const vnode: VNode = h(CanvasFrameDocument, {
    document: props.document,
    registry: props.blocks,
    editable: false,
    ownerDocument: mountEl.value.ownerDocument,
    untrustedEmbeds: props.untrustedEmbeds,
    slotFallbackLabel: (name: string) => t('canvas.slotFallback', { name }),
    unknownBlockLabel: (type: string) => t('canvas.unknownBlock', { type }),
    i18n,
  })

  render(vnode, mountEl.value)
}

watch(() => [props.document, props.blocks], () => {
  renderFrame()
}, { deep: true })

watch(frameRef, async (frame) => {
  if (!frame)
    return

  await nextTick()
  bootstrapFrame()
})

onBeforeUnmount(() => {
  if (mountEl.value)
    render(null, mountEl.value)
})
</script>

<template>
  <main class="flex-1 min-h-0 overflow-auto bg-uf-panel scrollbar-hide">
    <div class="mx-auto h-full transition-[width] duration-150" :style="{ width: widthStyle }">
      <iframe
        ref="frameRef"
        class="block w-full h-full min-h-full border-0 bg-transparent"
        :title="t('canvas.pagePreview')"
      />
    </div>
  </main>
</template>
