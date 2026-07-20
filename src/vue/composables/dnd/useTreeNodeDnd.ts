import type { Ref } from 'vue'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { onBeforeUnmount, onMounted } from 'vue'

type DropPosition = 'before' | 'after' | 'inside' | null

export const TREE_DRAG_TYPE = 'application/x-uf-tree-block'
export const LIBRARY_DRAG_TYPE = 'application/x-uf-block-type'

interface TreeNodeDndOptions {
  el: Ref<HTMLElement | null>
  blockId: Ref<string>
  parentId: Ref<string | null>
  acceptsChildren: Ref<boolean>
  /** Reorder an existing block within the tree. */
  onTreeDrop: (sourceId: string, targetParentId: string | null, targetIndex: number) => void
  /** Insert a brand-new block of `type` from the library. */
  onLibraryDrop: (blockType: string, targetParentId: string | null, targetIndex: number) => void
  /** Insert a user-defined component instance from the library. */
  onLibrarySymbolDrop?: (symbolId: string, targetParentId: string | null, targetIndex: number) => void
  /** Make this node draggable too (root pseudo-nodes opt out). */
  draggableSource?: boolean
  /** Virtual containers such as component Slots accept drops only inside. */
  insideOnly?: boolean
  /** Resolve current ordering of siblings for the parent containing this node. */
  getSiblings: () => string[]
  setDropPosition: (position: DropPosition) => void
}

/**
 * Picks before/after/inside based on cursor Y inside the row.
 *
 * For accepts-children rows the middle 50% is the "inside" zone — Pragmatic's
 * `attachClosestEdge` with `['top', 'bottom']` always picks one of the two
 * edges, so we'd never reach the inside fallback otherwise.
 */
function computeZone(
  input: { clientY: number },
  rect: DOMRect,
  acceptsChildren: boolean,
): DropPosition {
  const relativeY = input.clientY - rect.top
  const ratio = rect.height > 0 ? relativeY / rect.height : 0.5
  if (acceptsChildren) {
    if (ratio < 0.25)
      return 'before'
    if (ratio > 0.75)
      return 'after'
    return 'inside'
  }
  return ratio < 0.5 ? 'before' : 'after'
}

export function useTreeNodeDnd(options: TreeNodeDndOptions) {
  let cleanup: (() => void) | null = null

  onMounted(() => {
    const element = options.el.value
    if (!element)
      return

    const parts: Array<() => void> = []

    if (options.draggableSource !== false) {
      parts.push(draggable({
        element,
        getInitialData: () => ({
          [TREE_DRAG_TYPE]: true,
          blockId: options.blockId.value,
        }),
      }))
    }

    const positionFromEvent = (
      el: Element,
      input: { clientY: number },
      source: { data: Record<string, unknown> },
    ): DropPosition => {
      if (source.data[TREE_DRAG_TYPE] && source.data.blockId === options.blockId.value)
        return null
      if (options.insideOnly)
        return 'inside'
      return computeZone(input, el.getBoundingClientRect(), options.acceptsChildren.value)
    }

    parts.push(dropTargetForElements({
      element,
      canDrop: ({ source }) => {
        if (source.data[TREE_DRAG_TYPE])
          return source.data.blockId !== options.blockId.value
        if (source.data[LIBRARY_DRAG_TYPE])
          return true
        return false
      },
      getData: () => ({ blockId: options.blockId.value }),
      onDragEnter: ({ location, source, self }) => {
        options.setDropPosition(positionFromEvent(self.element, location.current.input, source))
      },
      onDrag: ({ location, source, self }) => {
        options.setDropPosition(positionFromEvent(self.element, location.current.input, source))
      },
      onDragLeave: () => {
        options.setDropPosition(null)
      },
      onDrop: ({ location, source, self }) => {
        const position = positionFromEvent(self.element, location.current.input, source)
        options.setDropPosition(null)
        if (!position)
          return

        const targetParentId = position === 'inside'
          ? options.blockId.value
          : options.parentId.value

        let targetIndex: number
        if (position === 'inside') {
          targetIndex = Number.MAX_SAFE_INTEGER
        }
        else {
          const siblings = options.getSiblings()
          const targetSiblingIndex = siblings.indexOf(options.blockId.value)
          if (targetSiblingIndex < 0)
            return
          targetIndex = position === 'before' ? targetSiblingIndex : targetSiblingIndex + 1
        }

        if (source.data[TREE_DRAG_TYPE]) {
          const sourceId = source.data.blockId as string | undefined
          if (!sourceId || sourceId === options.blockId.value)
            return
          options.onTreeDrop(sourceId, targetParentId, targetIndex)
        }
        else if (source.data[LIBRARY_DRAG_TYPE]) {
          const symbolId = source.data.symbolId as string | undefined
          if (symbolId) {
            options.onLibrarySymbolDrop?.(symbolId, targetParentId, targetIndex)
            return
          }
          const blockType = source.data.blockType as string | undefined
          if (!blockType)
            return
          options.onLibraryDrop(blockType, targetParentId, targetIndex)
        }
      },
    }))

    cleanup = combine(...parts)
  })

  onBeforeUnmount(() => {
    cleanup?.()
    cleanup = null
  })
}
