import type { Ref } from 'vue'
import type { Rect } from './canvas-overlay-types'
import type { CanvasChannel, PageEditorInstance } from '@/vue/context/editor-context'
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'

export interface UseCanvasContextBridgeOptions {
  canvas: CanvasChannel
  editor: PageEditorInstance
  paneRef: Ref<HTMLElement | null>
  frameRef: Ref<HTMLIFrameElement | null>
  selectionRect: Ref<Rect | null>
  selectionRadius: Ref<string | null>
  scrollBlockIntoView: (id: string) => void
}

/**
 * Publishes iframe geometry for plugin overlays and handles tree-to-canvas
 * reveal requests. It owns only the editor-context bridge, not measurement.
 */
export function useCanvasContextBridge(options: UseCanvasContextBridgeOptions) {
  const { canvas, editor, paneRef, frameRef, selectionRect, selectionRadius, scrollBlockIntoView } = options

  onMounted(() => {
    canvas.paneEl.value = paneRef.value
    canvas.frameEl.value = frameRef.value
  })
  onBeforeUnmount(() => {
    if (canvas.paneEl.value === paneRef.value)
      canvas.paneEl.value = null
    if (canvas.frameEl.value === frameRef.value)
      canvas.frameEl.value = null
  })
  watch(selectionRect, (rect) => {
    canvas.selectionRect.value = rect
  }, { immediate: true })
  watch(selectionRadius, (radius) => {
    canvas.selectionRadius.value = radius
  }, { immediate: true })

  // The layers panel asks the canvas to reveal a block it just selected. Wait
  // for any pending iframe re-render before measuring and scrolling it.
  watch(
    () => editor.revealBlockRequest.value?.nonce,
    () => {
      const request = editor.revealBlockRequest.value
      if (request)
        nextTick(() => scrollBlockIntoView(request.id))
    },
  )
}
