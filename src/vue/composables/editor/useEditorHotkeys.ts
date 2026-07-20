import type { PageEditorInstance } from '@/vue/context/editor-context'
import { useEventListener } from '@vueuse/core'

export type EditorHotkeyAction = 'undo' | 'redo' | 'removeSelected' | 'togglePreview'

function isEditableEl(el: Element | null): boolean {
  if (!el)
    return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el as HTMLElement).isContentEditable
}

/**
 * Map a keydown to an editor action, or null. `doc` is the document the event
 * fired in (the top window or the canvas iframe) — its `activeElement` decides
 * whether the user is typing, so Delete/Backspace don't delete the block while
 * editing text. Shared by the window listener and the iframe listener so the
 * shortcuts work regardless of which document holds focus.
 */
export function matchEditorHotkey(event: KeyboardEvent, doc: Document): EditorHotkeyAction | null {
  const mod = event.metaKey || event.ctrlKey
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
  if (mod && key === 'z')
    return event.shiftKey ? 'redo' : 'undo'
  if (mod && key === 'p')
    return 'togglePreview'
  if ((event.key === 'Delete' || event.key === 'Backspace') && !isEditableEl(doc.activeElement))
    return 'removeSelected'
  return null
}

/** Run a matched hotkey against the editor. */
export function applyEditorHotkey(action: EditorHotkeyAction, editor: PageEditorInstance): void {
  switch (action) {
    case 'undo':
      editor.undo()
      break
    case 'redo':
      editor.redo()
      break
    case 'removeSelected':
      if (editor.selectedBlockId.value)
        editor.removeBlock(editor.selectedBlockId.value)
      break
    case 'togglePreview':
      editor.isPreviewMode.value = !editor.isPreviewMode.value
      break
  }
}

/**
 * Bind the editor shortcuts to the top window. The canvas iframe has its own
 * document and keyboard focus, so it's handled separately in CanvasViewport via
 * the exported matchEditorHotkey / applyEditorHotkey — that way Cmd+Z, delete,
 * etc. fire even when focus is inside the iframe.
 */
export function useEditorHotkeys(editor: PageEditorInstance): void {
  useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    const action = matchEditorHotkey(event, document)
    if (!action)
      return
    event.preventDefault()
    applyEditorHotkey(action, editor)
  })
}
