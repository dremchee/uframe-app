import type { Ref } from 'vue'
import type { Rect, SpacingBox } from './canvas-overlay-types'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { useEventListener, useResizeObserver } from '@vueuse/core'
import { nextTick, onBeforeUnmount, watch, watchEffect } from 'vue'

export interface UseCanvasOverlayObserversOptions {
  editor: PageEditorInstance
  frameRef: Ref<HTMLIFrameElement | null>
  iframeDoc: Ref<Document | null>
  iframeWin: Ref<Window | null>
  hoveredBlockId: Ref<string | null>
  isDragging: Ref<boolean>
  selectedDomId: () => string | null
  measureBlockRect: (id: string | null) => Rect | null
  measureSpacingBox: (id: string | null) => SpacingBox | null
  recomputeAll: () => void
  recomputeSelection: () => void
  recomputeHover: () => void
  recomputeSpacing: () => void
  recomputeGrid: () => void
  recomputeFlex: () => void
  recomputeEditScope: () => void
  hoverRect: Ref<Rect | null>
  hoveredBlockLabelId: Ref<string | null>
}

/** Owns reactive triggers and DOM observers that keep canvas overlays fresh. */
export function useCanvasOverlayObservers(options: UseCanvasOverlayObserversOptions) {
  const {
    editor,
    frameRef,
    iframeDoc,
    iframeWin,
    hoveredBlockId,
    isDragging,
    selectedDomId,
    measureBlockRect,
    measureSpacingBox,
    recomputeAll,
    recomputeSelection,
    recomputeHover,
    recomputeSpacing,
    recomputeGrid,
    recomputeFlex,
    recomputeEditScope,
    hoverRect,
    hoveredBlockLabelId,
  } = options

  watch(
    [
      () => editor.selectedBlockId.value,
      () => editor.selectedInstanceId.value,
      () => editor.editScopeRootId.value,
      () => editor.documentRevision.value,
      () => editor.viewport.value,
    ],
    () => nextTick(() => {
      recomputeSelection()
      recomputeHover()
      recomputeGrid()
      recomputeFlex()
      recomputeEditScope()
    }),
    { immediate: true },
  )

  watch([hoveredBlockId, () => editor.hoveredInstanceId.value], () => nextTick(recomputeHover))
  watch(() => editor.spacingOverlay.value, () => nextTick(recomputeSpacing), { immediate: true })

  watch(isDragging, (next) => {
    if (next) {
      hoverRect.value = null
      hoveredBlockLabelId.value = null
    }
  })

  useEventListener(window, 'resize', recomputeAll)
  useEventListener(iframeWin, 'scroll', recomputeAll, { passive: true })
  useResizeObserver(frameRef, () => recomputeAll())

  let selectedBlockObserver: ResizeObserver | null = null
  let observedSelectedEl: HTMLElement | null = null
  watchEffect(() => {
    const id = selectedDomId()
    const doc = iframeDoc.value
    const win = iframeWin.value as (Window & typeof globalThis) | null
    void editor.documentRevision.value

    const element = id && doc ? doc.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(id)}"]`) : null
    if (element === observedSelectedEl)
      return

    selectedBlockObserver?.disconnect()
    selectedBlockObserver = null
    observedSelectedEl = null
    if (!element || !win || typeof win.ResizeObserver !== 'function')
      return
    selectedBlockObserver = new win.ResizeObserver(() => recomputeAll())
    selectedBlockObserver.observe(element)
    observedSelectedEl = element
  }, { flush: 'post' })

  let rafId: number | null = null
  let lastKey: string | null = null
  function tickKey(): string | null {
    const id = selectedDomId()
    if (!id)
      return null
    const rect = measureBlockRect(id)
    if (!rect)
      return null
    const spacing = measureSpacingBox(id)
    const margin = spacing?.margin
    const padding = spacing?.padding
    return [
      rect.top,
      rect.left,
      rect.width,
      rect.height,
      margin ? `${margin.top}|${margin.right}|${margin.bottom}|${margin.left}` : '',
      padding ? `${padding.top}|${padding.right}|${padding.bottom}|${padding.left}` : '',
    ].join('|')
  }

  function startRaf() {
    if (rafId !== null)
      return
    const tick = () => {
      const key = tickKey()
      if (key !== lastKey) {
        lastKey = key
        recomputeAll()
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
  }

  function stopRaf() {
    if (rafId === null)
      return
    cancelAnimationFrame(rafId)
    rafId = null
    lastKey = null
  }

  watch(() => editor.spacingOverlay.value, (next) => {
    if (next)
      startRaf()
    else
      stopRaf()
  })

  onBeforeUnmount(() => {
    stopRaf()
    selectedBlockObserver?.disconnect()
    selectedBlockObserver = null
    observedSelectedEl = null
  })
}
