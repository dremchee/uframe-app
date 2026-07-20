import type { Ref } from 'vue'
import type { CanvasChannel } from '@/vue/context/editor-context'
import { computed, nextTick, ref, watch } from 'vue'

interface UseAiFloatingWindowOptions {
  open: Ref<boolean>
  canvas: CanvasChannel
  windowRef: Ref<HTMLElement | undefined>
}

const MARGIN = 12
const GAP = 12
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/** Positions, drags, and resizes the AI dialog within the canvas pane. */
export function useAiFloatingWindow({ open, canvas, windowRef }: UseAiFloatingWindowOptions) {
  const position = ref<{ left: number, top: number } | null>(null)
  const size = ref<{ width: number, height: number | null }>({ width: 360, height: null })

  const windowStyle = computed(() => {
    const placement = position.value
      ? { left: `${position.value.left}px`, top: `${position.value.top}px` }
      : { right: '16px', bottom: '16px' }
    return {
      ...placement,
      width: `${size.value.width}px`,
      ...(size.value.height != null ? { height: `${size.value.height}px` } : { maxHeight: '70vh' }),
    }
  })

  function anchor() {
    const element = windowRef.value
    const pane = canvas.paneEl.value?.getBoundingClientRect()
    if (!element || !pane)
      return

    const width = element.offsetWidth
    const height = element.offsetHeight
    const minLeft = pane.left + MARGIN
    const maxLeft = Math.max(minLeft, pane.right - width - MARGIN)
    const minTop = pane.top + MARGIN
    const maxTop = Math.max(minTop, pane.bottom - height - MARGIN)
    const selection = canvas.selectionRect.value
    const frame = canvas.frameEl.value?.getBoundingClientRect()

    if (selection && frame) {
      position.value = {
        left: clamp(selection.left + frame.left + selection.width + GAP, minLeft, maxLeft),
        top: clamp(selection.top + frame.top, minTop, maxTop),
      }
    }
    else {
      position.value = {
        left: clamp(pane.left + (pane.width - width) / 2, minLeft, maxLeft),
        top: maxTop,
      }
    }
  }

  watch(open, async (isOpen) => {
    if (!isOpen)
      return
    await nextTick()
    anchor()
  })

  function onHeaderPointerDown(event: PointerEvent) {
    const element = windowRef.value
    if (!element || (event.target as HTMLElement).closest('button'))
      return
    event.preventDefault()
    const rect = element.getBoundingClientRect()
    const offsetX = event.clientX - rect.left
    const offsetY = event.clientY - rect.top
    const handle = event.currentTarget as HTMLElement
    handle.setPointerCapture(event.pointerId)

    const move = (pointerEvent: PointerEvent) => {
      const pane = canvas.paneEl.value?.getBoundingClientRect()
      const minLeft = pane ? pane.left + 4 : 4
      const maxLeft = (pane ? pane.right : window.innerWidth) - rect.width - 4
      const minTop = pane ? pane.top + 4 : 4
      const maxTop = (pane ? pane.bottom : window.innerHeight) - rect.height - 4
      position.value = {
        left: clamp(pointerEvent.clientX - offsetX, minLeft, Math.max(minLeft, maxLeft)),
        top: clamp(pointerEvent.clientY - offsetY, minTop, Math.max(minTop, maxTop)),
      }
    }
    const up = (pointerEvent: PointerEvent) => {
      handle.releasePointerCapture(pointerEvent.pointerId)
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up)
  }

  function onResizePointerDown(event: PointerEvent) {
    const element = windowRef.value
    if (!element)
      return
    event.preventDefault()
    event.stopPropagation()
    const rect = element.getBoundingClientRect()
    position.value = { left: rect.left, top: rect.top }
    const startX = event.clientX
    const startY = event.clientY
    const startWidth = rect.width
    const startHeight = rect.height
    const handle = event.currentTarget as HTMLElement
    handle.setPointerCapture(event.pointerId)

    const move = (pointerEvent: PointerEvent) => {
      const pane = canvas.paneEl.value?.getBoundingClientRect()
      const maxWidth = (pane ? pane.right : window.innerWidth) - rect.left - MARGIN
      const maxHeight = (pane ? pane.bottom : window.innerHeight) - rect.top - MARGIN
      size.value = {
        width: clamp(startWidth + (pointerEvent.clientX - startX), 300, Math.max(300, maxWidth)),
        height: clamp(startHeight + (pointerEvent.clientY - startY), 240, Math.max(240, maxHeight)),
      }
    }
    const up = (pointerEvent: PointerEvent) => {
      handle.releasePointerCapture(pointerEvent.pointerId)
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up)
  }

  return { windowStyle, onHeaderPointerDown, onResizePointerDown }
}
