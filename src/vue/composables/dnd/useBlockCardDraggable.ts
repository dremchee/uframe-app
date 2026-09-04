import type { Ref } from 'vue'
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { onBeforeUnmount, onMounted } from 'vue'
import { setLibraryCardDragPreview } from '@/vue/composables/dnd/setLibraryCardDragPreview'
import { LIBRARY_DRAG_TYPE } from '@/vue/composables/dnd/useTreeNodeDnd'

type ElOrInstance = HTMLElement | { $el?: unknown } | null

function resolveElement(value: ElOrInstance): HTMLElement | null {
  if (!value)
    return null
  if (value instanceof HTMLElement)
    return value
  const root = (value as { $el?: unknown }).$el
  return root instanceof HTMLElement ? root : null
}

/** Makes a library card draggable; `presetId` rides along for preset cards. */
export function useBlockCardDraggable(el: Ref<ElOrInstance>, blockType: Ref<string>, presetId?: Ref<string | undefined>) {
  let cleanup: (() => void) | null = null

  onMounted(() => {
    const element = resolveElement(el.value)
    if (!element)
      return
    const draggableElement: HTMLElement = element

    cleanup = draggable({
      element: draggableElement,
      getInitialData: () => ({
        [LIBRARY_DRAG_TYPE]: true,
        blockType: blockType.value,
        presetId: presetId?.value,
      }),
    })
    draggableElement.addEventListener('dragstart', onDragStart)

    function onDragStart(event: DragEvent) {
      setLibraryCardDragPreview(draggableElement, event)
    }

    const previousCleanup = cleanup
    cleanup = () => {
      draggableElement.removeEventListener('dragstart', onDragStart)
      previousCleanup()
    }
  })

  onBeforeUnmount(() => {
    cleanup?.()
    cleanup = null
  })
}
