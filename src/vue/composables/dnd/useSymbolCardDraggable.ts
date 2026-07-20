import type { Ref } from 'vue'
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { onBeforeUnmount, onMounted } from 'vue'
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

export function useSymbolCardDraggable(el: Ref<ElOrInstance>, symbolId: Ref<string>) {
  let cleanup: (() => void) | null = null

  onMounted(() => {
    const element = resolveElement(el.value)
    if (!element)
      return

    cleanup = draggable({
      element,
      getInitialData: () => ({
        [LIBRARY_DRAG_TYPE]: true,
        symbolId: symbolId.value,
      }),
    })
  })

  onBeforeUnmount(() => {
    cleanup?.()
    cleanup = null
  })
}
