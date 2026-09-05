import type { Ref } from 'vue'
import type { CanvasChannel } from '@/vue/context/editor-context'
import { useElementBounding } from '@vueuse/core'
import { computed, onScopeDispose, ref, watch } from 'vue'

import { clampPanel, placeCanvasPanel } from '@/vue/utils/canvas-panel-placement'

export interface UseCanvasAnchoredPanelOptions {
  preferredSize: Ref<{ width: number, height: number }>
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
 * prefers space beside, below or above the block, then docks at the pane edge; a drag adds an offset that is
 * kept until the selection changes. Everything is clamped to the canvas pane.
 */
export function useCanvasAnchoredPanel({ canvas, panelRef, resetKey, preferredSize }: UseCanvasAnchoredPanelOptions) {
  const frame = useElementBounding(canvas.frameEl)
  const pane = useElementBounding(canvas.paneEl)
  const size = useElementBounding(panelRef)
  const offset = ref({ x: 0, y: 0 })

  watch(resetKey, () => {
    offset.value = { x: 0, y: 0 }
  })

  const placement = computed(() => {
    const selection = canvas.selectionRect.value
    return placeCanvasPanel(
      { left: pane.left.value, top: pane.top.value, width: pane.width.value, height: Math.max(0, pane.height.value - 36) },
      selection ? { ...selection, left: frame.left.value + selection.left, top: frame.top.value + selection.top } : null,
      { width: preferredSize.value.width, height: Math.max(preferredSize.value.height, size.height.value) },
    )
  })
  const docked = computed(() => placement.value.docked)
  const style = computed<Record<string, string>>(() => {
    const width = size.width.value || preferredSize.value.width
    const height = size.height.value || preferredSize.value.height
    const minLeft = pane.left.value + 12
    const minTop = pane.top.value + 12
    return {
      left: `${clampPanel(placement.value.left + offset.value.x, minLeft, pane.right.value - width - 12)}px`,
      top: `${clampPanel((docked.value ? pane.bottom.value - height - 48 : placement.value.top) + offset.value.y, minTop, pane.bottom.value - height - 48)}px`,
      maxWidth: `${Math.max(0, pane.width.value - 24)}px`,
      maxHeight: `${Math.max(0, pane.height.value - 60)}px`,
    }
  })
  let stopDrag = () => {}
  onScopeDispose(() => stopDrag())

  /** Bind to the panel's drag handle (its header). Controls inside the handle keep working. */
  function onHandlePointerDown(event: PointerEvent) {
    const target = event.target as HTMLElement | null
    if (target?.closest('button, input, select, textarea, [role="tab"], [role="menuitem"]'))
      return
    if (event.button !== 0)
      return
    stopDrag()
    event.preventDefault()
    const handle = event.currentTarget as HTMLElement
    handle.setPointerCapture(event.pointerId)
    const startX = event.clientX
    const startY = event.clientY
    const start = { ...offset.value }

    const move = (pointerEvent: PointerEvent) => {
      offset.value = { x: start.x + pointerEvent.clientX - startX, y: start.y + pointerEvent.clientY - startY }
    }
    const up = () => {
      if (handle.hasPointerCapture(event.pointerId))
        handle.releasePointerCapture(event.pointerId)
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
      handle.removeEventListener('pointercancel', up)
      handle.removeEventListener('lostpointercapture', up)
    }
    stopDrag = up
    handle.addEventListener('pointercancel', up)
    handle.addEventListener('lostpointercapture', up)
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up)
  }

  return { style, docked, onHandlePointerDown }
}
