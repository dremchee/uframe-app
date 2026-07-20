import type { Ref } from 'vue'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { useEventListener, useResizeObserver } from '@vueuse/core'
import { onBeforeUnmount, watch } from 'vue'

interface CachedBlock {
  id: string
  top: number
  left: number
  right: number
  bottom: number
  area: number
}

/**
 * Coordinate-based hit-test for canvas blocks. `event.target` is unreliable
 * when an inner element (Embed, form field, ...) carries `pointer-events: none`
 * — the browser dispatches the click to whatever sits behind it, and
 * Chromium's `elementsFromPoint` silently skips those elements too. This walks
 * every `[data-block-id]` and picks the smallest box that contains the point.
 *
 * `.uf-canvas-block` is `display: contents` (no own rect), and for symbol
 * instances the first child is *also* a contents-wrapper. `firstBox` descends
 * until it finds a real layout box to measure.
 *
 * Rect cache: building the per-block rect list on every mousemove is O(N)
 * `getBoundingClientRect` calls (~3-5 ms on a 100-block page, ×60 = 200 ms/s).
 * The cache is rebuilt lazily on first read after invalidation, and
 * invalidated on commit (document.updatedAt), viewport change, iframe scroll
 * and iframe-element resize. None of those fire on every mousemove, so the
 * common case is a free walk through a precomputed array.
 */
function firstBox(el: Element): Element | null {
  let cur: Element | null = el
  while (cur) {
    const r = cur.getBoundingClientRect()
    if (r.width > 0 && r.height > 0)
      return cur
    cur = cur.firstElementChild
  }
  return null
}

export function useCanvasHitTest(opts: {
  editor: PageEditorInstance
  frameRef: Ref<HTMLIFrameElement | null>
  iframeDoc: Ref<Document | null>
  iframeWin: Ref<Window | null>
}) {
  const { editor, frameRef, iframeDoc, iframeWin } = opts
  let cache: CachedBlock[] | null = null

  function invalidate() {
    cache = null
  }

  function rebuild(): CachedBlock[] {
    const doc = iframeDoc.value
    if (!doc)
      return []
    const nodes = doc.querySelectorAll<HTMLElement>('[data-block-id]')
    const next: CachedBlock[] = []
    for (const el of nodes) {
      const box = firstBox(el)
      if (!box)
        continue
      const r = box.getBoundingClientRect()
      if (r.width === 0 || r.height === 0)
        continue
      const id = el.dataset.blockId
      if (!id)
        continue
      next.push({
        id,
        top: r.top,
        left: r.left,
        right: r.right,
        bottom: r.bottom,
        area: r.width * r.height,
      })
    }
    return next
  }

  function hitTestBlock(x: number, y: number): string | null {
    if (!cache)
      cache = rebuild()
    let bestId: string | null = null
    let bestArea = Infinity
    for (const b of cache) {
      if (x < b.left || x > b.right || y < b.top || y > b.bottom)
        continue
      // `<=`, not `<`: when a child exactly fills its parent (a `div` tightly
      // wrapping a `text`, no padding), their rects — and areas — are equal.
      // `cache` is in DOM pre-order (ancestors before descendants), so `<=`
      // lets the deeper block, which comes later, win the tie. With a strict
      // `<` the innermost block was unreachable — clicks landed on the parent.
      if (b.area <= bestArea) {
        bestArea = b.area
        bestId = b.id
      }
    }
    return bestId
  }

  // Invalidation triggers. Each is a layout-affecting event that can shift
  // block rects without us seeing a Vue reactivity tick. documentRevision
  // covers every document AND globals commit path (class-style edits in
  // shared-globals mode reflow the canvas without touching the document).
  watch(
    [
      iframeDoc,
      () => editor.documentRevision.value,
      () => editor.viewport.value,
      () => editor.canvasWidth.value,
    ],
    invalidate,
  )
  useEventListener(window, 'resize', invalidate)
  useEventListener(iframeWin, 'scroll', invalidate, { passive: true })
  useResizeObserver(frameRef, invalidate)

  // Let the GC reclaim cache entries when the editor unmounts.
  onBeforeUnmount(() => {
    cache = null
  })

  return { hitTestBlock, invalidate }
}
