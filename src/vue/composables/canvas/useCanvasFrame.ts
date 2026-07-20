import type { Ref } from 'vue'
import { nextTick, onBeforeUnmount, render, shallowRef, watch } from 'vue'
import { pageFrameStyles } from '@/styles/page-frame'

interface UseCanvasFrameOptions {
  frame: Readonly<Ref<HTMLIFrameElement | null>>
  renderDocument: (mountElement: HTMLElement) => void
  recomputeOverlays: () => void
}

export function useCanvasFrame({ frame, renderDocument, recomputeOverlays }: UseCanvasFrameOptions) {
  const mountElement = shallowRef<HTMLElement | null>(null)
  // `contentDocument` is not reactive and doc.open()/close() replaces it,
  // so consumers subscribe to this explicit source instead.
  const iframeDoc = shallowRef<Document | null>(null)
  const iframeWin = shallowRef<Window | null>(null)

  function renderFrame() {
    const mount = mountElement.value
    if (!mount)
      return

    renderDocument(mount)
    // Iframe DOM just changed — selection/hover rects must be re-measured
    // against the new layout. An early ResizeObserver fire can otherwise
    // permanently leave the rects unset.
    nextTick(recomputeOverlays)
    // Stylesheet adoption + reflow can land after nextTick, so keep a second
    // pass for layout-only changes that don't resize a selected block.
    requestAnimationFrame(recomputeOverlays)
  }

  function bootstrapFrame() {
    const doc = frame.value?.contentDocument ?? null
    if (!doc)
      return

    doc.open()
    doc.write(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>${pageFrameStyles}</style>
        </head>
        <body></body>
      </html>`)
    doc.close()

    mountElement.value = doc.body
    iframeDoc.value = doc
    iframeWin.value = doc.defaultView
    renderFrame()
  }

  watch(frame, async (element) => {
    if (!element)
      return

    await nextTick()
    bootstrapFrame()
  })

  onBeforeUnmount(() => {
    if (mountElement.value)
      render(null, mountElement.value)
  })

  return { iframeDoc, iframeWin, renderFrame }
}
