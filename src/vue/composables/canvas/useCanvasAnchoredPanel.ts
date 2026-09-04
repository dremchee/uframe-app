import type { Ref } from 'vue'
import type { CanvasChannel } from '@/vue/context/editor-context'
import { useElementBounding, useElementSize } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

const MARGIN = 12
const GAP = 12
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export interface UseCanvasAnchoredPanelOptions {
  canvas: CanvasChannel
  /** The floating panel element (measured for clamping). */
  panelRef: Ref<HTMLElement | null | undefined>
  /** When this changes (a new selection) the user's drag offset is forgotten. */
  resetKey: Ref<unknown>
}

/**
 * Positions a `position: fixed` panel next to the canvas selection and keeps
 * it there: the selection box is republished by the canvas on every scroll and
 * layout change, and the iframe / pane bounds are observed, so the computed
 * style follows the block without an explicit re-anchor step. Placement
 * prefers the block's right side, then its left, then its own top-right corner
 * (a full-width section has no room beside it); a drag adds an offset that is
 * kept until the selection changes. Everything is clamped to the canvas pane.
 */
export function useCanvasAnchoredPanel({ canvas, panelRef, resetKey }: UseCanvasAnchoredPanelOptions) {
  const frame = useElementBounding(canvas.frameEl)
  const pane = useElementBounding(canvas.paneEl)
  const size = useElementSize(panelRef)
  const offset = ref({ x: 0, y: 0 })

  watch(resetKey, () => {
    offset.value = { x: 0, y: 0 }
  })

  const style = computed<Record<string, string>>(() => {
    const selection = canvas.selectionRect.value
    const width = size.width.value || 320
    const height = size.height.value || 56
    const minLeft = pane.left.value + MARGIN
    const maxLeft = Math.max(minLeft, pane.right.value - width - MARGIN)
    const minTop = pane.top.value + MARGIN
    const maxTop = Math.max(minTop, pane.bottom.value - height - MARGIN)

    let left: number
    let top: number
    if (selection) {
      const blockLeft = frame.left.value + selection.left
      const blockRight = blockLeft + selection.width
      top = frame.top.value + selection.top
      if (blockRight + GAP + width <= pane.right.value - MARGIN) {
        left = blockRight + GAP
      }
      else if (blockLeft - GAP - width >= minLeft) {
        left = blockLeft - GAP - width
      }
      else {
        left = blockRight - width - GAP
        top += GAP
      }
    }
    else {
      left = pane.left.value + (pane.width.value - width) / 2
      top = maxTop
    }

    return {
      left: `${clamp(left + offset.value.x, minLeft, maxLeft)}px`,
      top: `${clamp(top + offset.value.y, minTop, maxTop)}px`,
    }
  })

  /** Bind to the panel's drag handle (its header). Controls inside the handle keep working. */
  function onHandlePointerDown(event: PointerEvent) {
    const target = event.target as HTMLElement | null
    if (target?.closest('button, input, select, textarea, [role="tab"], [role="menuitem"]'))
      return
    event.preventDefault()
    const handle = event.currentTarget as HTMLElement
    handle.setPointerCapture(event.pointerId)
    const startX = event.clientX
    const startY = event.clientY
    const start = { ...offset.value }

    const move = (pointerEvent: PointerEvent) => {
      offset.value = { x: start.x + pointerEvent.clientX - startX, y: start.y + pointerEvent.clientY - startY }
    }
    const up = (pointerEvent: PointerEvent) => {
      handle.releasePointerCapture(pointerEvent.pointerId)
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up)
  }

  return { style, onHandlePointerDown }
}
