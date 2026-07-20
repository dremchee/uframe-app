import type { Ref } from 'vue'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { useEventListener } from '@vueuse/core'
import { baseBlockId } from '@/core'
import { applyEditorHotkey, matchEditorHotkey } from '@/vue/composables/editor/useEditorHotkeys'
import { useCanvasHitTest } from './useCanvasHitTest'

export interface UseCanvasInteractionsOptions {
  editor: PageEditorInstance
  frameRef: Ref<HTMLIFrameElement | null>
  iframeDoc: Ref<Document | null>
  iframeWin: Ref<Window | null>
  isDragging: Ref<boolean>
  hotkeysEnabled: () => boolean
  onCanvasClick?: () => void
}

/**
 * Wires canvas-iframe input to editor selection and symbol editing. Event
 * listeners stay scoped to the iframe, whose document is recreated with the
 * canvas frame, while all document mutations remain explicit editor actions.
 */
export function useCanvasInteractions(options: UseCanvasInteractionsOptions) {
  const { editor, frameRef, iframeDoc, iframeWin, isDragging, hotkeysEnabled, onCanvasClick } = options
  const { hitTestBlock } = useCanvasHitTest({ editor, frameRef, iframeDoc, iframeWin })

  function onIframeClick(event: MouseEvent) {
    onCanvasClick?.()
    const domId = hitTestBlock(event.clientX, event.clientY)
    // While editing a component in place, clicking a dimmed (out-of-scope) area
    // hit-tests to null — keep the current in-scope selection rather than clearing.
    if (domId == null && editor.editScopeRootId.value != null)
      return
    // domId may carry a Data List preview suffix (`base~n`) — select the one
    // template block, but remember the copy so the overlay outlines it.
    editor.selectBlockInstance(domId)
    editor.requestRevealInTree(domId ? baseBlockId(domId) : null)
  }

  function onIframeMouseMove(event: MouseEvent) {
    if (isDragging.value) {
      editor.setHoveredBlock(null, 'canvas')
      return
    }
    editor.setHoveredBlockInstance(hitTestBlock(event.clientX, event.clientY))
  }

  // Double-clicking a component (symbol instance) opens it for editing — the
  // same as "Edit master" in the properties panel.
  function onIframeDblClick(event: MouseEvent) {
    const domId = hitTestBlock(event.clientX, event.clientY)
    // While editing a component in place, a double-click outside it (the dimmed
    // area has no hittable block) exits the edit.
    if (editor.editScopeRootId.value != null && !domId) {
      editor.exitSymbolEdit()
      return
    }
    if (!domId)
      return
    editor.enterInstanceMasterEdit(baseBlockId(domId))
  }

  // Editor shortcuts (undo/redo/delete/preview) when focus is inside the canvas
  // iframe — the window-level handler can't see keydowns there. Skips while
  // editing text in the frame (matchEditorHotkey checks the active element).
  function onIframeKeydown(event: KeyboardEvent) {
    const doc = iframeDoc.value
    if (!hotkeysEnabled() || !doc)
      return
    const action = matchEditorHotkey(event, doc)
    if (!action)
      return
    event.preventDefault()
    applyEditorHotkey(action, editor)
  }

  useEventListener(iframeDoc, 'click', onIframeClick)
  useEventListener(iframeDoc, 'mousemove', onIframeMouseMove)
  useEventListener(iframeDoc, 'mouseleave', () => editor.setHoveredBlock(null, 'canvas'))
  useEventListener(iframeDoc, 'dblclick', onIframeDblClick)
  useEventListener(iframeDoc, 'keydown', onIframeKeydown)
}
