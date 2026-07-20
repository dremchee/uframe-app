import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import type { Ref } from 'vue'
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { getReorderDestinationIndex } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { onBeforeUnmount, onMounted } from 'vue'

interface RowReorderDndOptions {
  /** A unique drag type key so unrelated lists don't accept each other's drags. */
  dragType: string
  /** The row element — both the drag source and the drop target. */
  el: Ref<HTMLElement | null>
  /** Only this element initiates the drag (the grip handle). */
  handle: Ref<HTMLElement | null>
  /** This row's current position; read lazily so reorders stay correct. */
  index: Ref<number>
  onReorder: (from: number, to: number) => void
  /** Which edge the dragged row would drop against (for the indicator line). */
  setEdge: (edge: Edge | null) => void
  setDragging: (dragging: boolean) => void
}

/**
 * Vertical list reordering for one row, built on Pragmatic drag-and-drop (the
 * same primitives the canvas / tree DnD use). The grip is the drag handle; the
 * row is a drop target with closest-edge detection, and the final position is
 * resolved with Pragmatic's reorder helper (post-removal index semantics).
 * Shared by the Variables and Breakpoints lists via a per-list `dragType`.
 */
export function useRowReorderDnd(options: RowReorderDndOptions) {
  let cleanup: (() => void) | null = null

  onMounted(() => {
    const element = options.el.value
    if (!element)
      return

    cleanup = combine(
      draggable({
        element,
        dragHandle: options.handle.value ?? undefined,
        getInitialData: () => ({ [options.dragType]: true, index: options.index.value }),
        onDragStart: () => options.setDragging(true),
        onDrop: () => options.setDragging(false),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => source.data[options.dragType] === true,
        getData: ({ input, element: el }) =>
          attachClosestEdge({ index: options.index.value }, { input, element: el, allowedEdges: ['top', 'bottom'] }),
        getIsSticky: () => true,
        onDrag: ({ self, source }) => {
          const onSelf = source.data.index === options.index.value
          options.setEdge(onSelf ? null : extractClosestEdge(self.data))
        },
        onDragLeave: () => options.setEdge(null),
        onDrop: ({ self, source }) => {
          options.setEdge(null)
          const from = source.data.index
          if (typeof from !== 'number')
            return
          const to = getReorderDestinationIndex({
            startIndex: from,
            indexOfTarget: options.index.value,
            closestEdgeOfTarget: extractClosestEdge(self.data),
            axis: 'vertical',
          })
          if (from !== to)
            options.onReorder(from, to)
        },
      }),
    )
  })

  onBeforeUnmount(() => {
    cleanup?.()
    cleanup = null
  })
}
