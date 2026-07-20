import type { Ref } from 'vue'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { dropTargetForElements, monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { baseBlockId } from '@/core'
import { LIBRARY_DRAG_TYPE, TREE_DRAG_TYPE } from '@/vue/composables/dnd/useTreeNodeDnd'
import { renderedBoxElement } from '@/vue/utils/canvas-dom'

export type CanvasDropPosition = 'before' | 'after' | 'inside'

export interface CanvasDropIndicator {
  blockId: string
  position: CanvasDropPosition
  rect: { top: number, left: number, width: number, height: number }
  /** Set when the target is a component Slot (blockId = owning instance) — drops append to its fill. */
  slotId?: string
}

/**
 * Where a drop lands: a position among a parent's children, or a component
 * Slot (which appends — the editor owns creating the fill when needed).
 */
export type CanvasDropTarget
  = | { kind: 'position', parentId: string | null, index: number }
    | { kind: 'slot', instanceId: string, slotId: string }

interface UseCanvasDropOverlayOptions {
  overlay: Ref<HTMLElement | null>
  iframe: Ref<HTMLIFrameElement | null>
  isDescendantOf: (ancestorId: string, descendantId: string) => boolean
  resolveDropTarget: (hit: CanvasDropIndicator) => { parentId: string | null, index: number } | null
  onTreeDrop: (sourceId: string, target: CanvasDropTarget) => void
  onLibraryDrop: (blockType: string, target: CanvasDropTarget) => void
  onLibrarySymbolDrop?: (symbolId: string, target: CanvasDropTarget) => void
}

export function useCanvasDropOverlay(options: UseCanvasDropOverlayOptions) {
  const indicator = ref<CanvasDropIndicator | null>(null)
  const isDragging = ref(false)
  let cleanup: (() => void) | null = null

  function hitTest(clientX: number, clientY: number, sourceBlockId: string | null): CanvasDropIndicator | null {
    const iframe = options.iframe.value
    const overlay = options.overlay.value
    if (!iframe || !overlay)
      return null

    const overlayRect = overlay.getBoundingClientRect()
    const x = clientX - overlayRect.left
    const y = clientY - overlayRect.top

    const doc = iframe.contentDocument
    if (!doc)
      return null

    const win = doc.defaultView
    const blocks = Array.from(doc.querySelectorAll<HTMLElement>('.uf-canvas-block')).reverse()
    for (const el of blocks) {
      // A Data List preview copy tags its id with `~n`; resolve to the canonical
      // block so a drop onto any copy targets the one template (the indicator
      // rect still tracks the specific copy under the cursor).
      const blockId = el.dataset.blockId ? baseBlockId(el.dataset.blockId) : undefined
      // Component Slots inside instances carry no data-block-id, only the
      // slot-target pair (see CanvasBlockRenderer.slotDropTarget).
      const slotInstanceId = el.dataset.slotInstanceId
      const slotId = el.dataset.slotId
      if (!blockId && !(slotInstanceId && slotId))
        continue

      // The wrapper is display:contents (no box of its own) — descend to the
      // first element that actually generates a box and hit-test against that.
      const boxEl = renderedBoxElement(el, win)
      if (!boxEl)
        continue
      const rect = boxEl.getBoundingClientRect()
      if (x < rect.left || x > rect.right)
        continue
      if (y < rect.top || y > rect.bottom)
        continue

      // A Slot is an opaque append-only target: no before/after zones, and no
      // dropping a block into a Slot of an instance it contains.
      if (slotInstanceId && slotId) {
        if (sourceBlockId && (slotInstanceId === sourceBlockId || options.isDescendantOf(sourceBlockId, slotInstanceId)))
          continue
        return {
          blockId: slotInstanceId,
          position: 'inside',
          rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
          slotId,
        }
      }
      if (!blockId)
        continue

      // Forbid drops on self or descendants.
      if (sourceBlockId && (blockId === sourceBlockId || options.isDescendantOf(sourceBlockId, blockId)))
        continue

      const acceptsChildren = el.dataset.acceptsChildren === 'true'
      const rel = (y - rect.top) / Math.max(rect.height, 1)
      let position: CanvasDropPosition
      if (rel < 0.25)
        position = 'before'
      else if (rel > 0.75)
        position = 'after'
      else if (acceptsChildren)
        position = 'inside'
      else position = 'after'

      return {
        blockId,
        position,
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      }
    }

    return null
  }

  // Safety net: any pointer release should clear isDragging. Pragmatic's
  // onDrop is normally reliable, but HMR / cancelled drags / errors in a
  // sibling handler can leave isDragging stuck. A stuck `true` is doubly
  // painful: the overlay captures pointer events (iframe clicks die) AND
  // the selection outline is hidden (it's gated by `!isDragging`). Window
  // pointerup is idempotent — it just makes sure we never persist a stale
  // drag state past the gesture's end.
  function resetDragOnPointerUp() {
    if (isDragging.value)
      isDragging.value = false
  }

  onMounted(() => {
    window.addEventListener('pointerup', resetDragOnPointerUp, { passive: true })
    cleanup = combine(
      monitorForElements({
        canMonitor: ({ source }) => !!source.data[TREE_DRAG_TYPE] || !!source.data[LIBRARY_DRAG_TYPE],
        // Pointer-events on the iframe are bound declaratively in the
        // template via isDragging — don't mutate inline style here, or any
        // stale handler that misses onDrop will leave the iframe stuck and
        // unclickable.
        onDragStart: () => {
          isDragging.value = true
        },
        onDrop: () => {
          isDragging.value = false
          indicator.value = null
        },
      }),

      dropTargetForElements({
        element: options.overlay.value!,
        canDrop: ({ source }) => !!source.data[TREE_DRAG_TYPE] || !!source.data[LIBRARY_DRAG_TYPE],
        onDrag: ({ location, source }) => {
          const sourceBlockId = source.data[TREE_DRAG_TYPE] ? (source.data.blockId as string) : null
          indicator.value = hitTest(
            location.current.input.clientX,
            location.current.input.clientY,
            sourceBlockId,
          )
        },
        onDragLeave: () => {
          indicator.value = null
        },
        onDrop: ({ source }) => {
          const hit = indicator.value
          indicator.value = null
          if (!hit)
            return

          // Slot hits skip resolveDropTarget: the fill they append to may not
          // exist yet, so the editor owns the whole prepare-and-insert step.
          const resolved = hit.slotId ? null : options.resolveDropTarget(hit)
          const target: CanvasDropTarget | null = hit.slotId
            ? { kind: 'slot', instanceId: hit.blockId, slotId: hit.slotId }
            : resolved && { kind: 'position', ...resolved }
          if (!target)
            return

          if (source.data[TREE_DRAG_TYPE]) {
            const sourceId = source.data.blockId as string | undefined
            if (sourceId && sourceId !== hit.blockId)
              options.onTreeDrop(sourceId, target)
          }
          else if (source.data[LIBRARY_DRAG_TYPE]) {
            const symbolId = source.data.symbolId as string | undefined
            if (symbolId) {
              options.onLibrarySymbolDrop?.(symbolId, target)
              return
            }
            const blockType = source.data.blockType as string | undefined
            if (blockType)
              options.onLibraryDrop(blockType, target)
          }
        },
      }),
    )
  })

  onBeforeUnmount(() => {
    window.removeEventListener('pointerup', resetDragOnPointerUp)
    cleanup?.()
    cleanup = null
  })

  return { indicator, isDragging }
}
