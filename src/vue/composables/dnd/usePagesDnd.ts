import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import type { Ref } from 'vue'
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { onBeforeUnmount, onMounted } from 'vue'

// Drag types so page rows and groups can be told apart at the drop site.
const PAGE_DND = 'uframe-page-dnd'
const GROUP_DND = 'uframe-group-dnd'

interface PageRowDndOptions {
  el: Ref<HTMLElement | null>
  handle?: Ref<HTMLElement | null>
  pageId: Ref<string>
  setEdge: (edge: Edge | null) => void
  setDragging: (dragging: boolean) => void
  onDrop: (payload: { draggedId: string, edge: Edge | null }) => void
}

/** Page-list row: draggable + closest-edge drop target (Pragmatic DnD). */
export function usePageRowDnd(options: PageRowDndOptions) {
  let cleanup: (() => void) | null = null

  onMounted(() => {
    const element = options.el.value
    if (!element)
      return

    cleanup = combine(
      draggable({
        element,
        dragHandle: options.handle?.value ?? undefined,
        getInitialData: () => ({ [PAGE_DND]: true, pageId: options.pageId.value }),
        onDragStart: () => options.setDragging(true),
        onDrop: () => options.setDragging(false),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => source.data[PAGE_DND] === true,
        getData: ({ input, element: el }) =>
          attachClosestEdge({ pageId: options.pageId.value }, { input, element: el, allowedEdges: ['top', 'bottom'] }),
        getIsSticky: () => true,
        onDrag: ({ self, source }) => {
          const onSelf = source.data.pageId === options.pageId.value
          options.setEdge(onSelf ? null : extractClosestEdge(self.data))
        },
        onDragLeave: () => options.setEdge(null),
        onDrop: ({ self, source }) => {
          options.setEdge(null)
          const draggedId = source.data.pageId
          if (typeof draggedId === 'string')
            options.onDrop({ draggedId, edge: extractClosestEdge(self.data) })
        },
      }),
    )
  })

  onBeforeUnmount(() => {
    cleanup?.()
    cleanup = null
  })
}

interface GroupNodeDndOptions {
  el: Ref<HTMLElement | null>
  handle?: Ref<HTMLElement | null>
  groupPath: Ref<string>
  setOver: (over: boolean) => void
  setDragging: (dragging: boolean) => void
  /** A page row was dropped onto this group → move it into the group. */
  onDropPage: (draggedId: string) => void
  /** Another group was dropped onto this group → nest it inside. */
  onDropGroup: (draggedPath: string) => void
}

/** Group header: draggable group + drop target accepting pages or other groups. */
export function useGroupNodeDnd(options: GroupNodeDndOptions) {
  let cleanup: (() => void) | null = null

  onMounted(() => {
    const element = options.el.value
    if (!element)
      return

    cleanup = combine(
      draggable({
        element,
        dragHandle: options.handle?.value ?? undefined,
        getInitialData: () => ({ [GROUP_DND]: true, groupPath: options.groupPath.value }),
        onDragStart: () => options.setDragging(true),
        onDrop: () => options.setDragging(false),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => {
          if (source.data[PAGE_DND] === true)
            return true
          // A group can't be dropped onto itself or its own descendants.
          if (source.data[GROUP_DND] === true) {
            const from = source.data.groupPath
            const here = options.groupPath.value
            return typeof from === 'string' && from !== here && !here.startsWith(`${from}/`)
          }
          return false
        },
        getIsSticky: () => true,
        onDragEnter: () => options.setOver(true),
        onDragLeave: () => options.setOver(false),
        onDrop: ({ source }) => {
          options.setOver(false)
          if (source.data[PAGE_DND] === true && typeof source.data.pageId === 'string')
            options.onDropPage(source.data.pageId)
          else if (source.data[GROUP_DND] === true && typeof source.data.groupPath === 'string')
            options.onDropGroup(source.data.groupPath)
        },
      }),
    )
  })

  onBeforeUnmount(() => {
    cleanup?.()
    cleanup = null
  })
}

interface GroupDropOptions {
  el: Ref<HTMLElement | null>
  setOver: (over: boolean) => void
  /** A page row dropped here. */
  onDropPage: (draggedId: string) => void
  /** A group dropped here (e.g. the root zone → un-nest to top level). */
  onDropGroup?: (draggedPath: string) => void
}

/** A plain drop zone (the root / ungrouped area) accepting pages and groups. */
export function useGroupDropTarget(options: GroupDropOptions) {
  let cleanup: (() => void) | null = null

  onMounted(() => {
    const element = options.el.value
    if (!element)
      return

    cleanup = dropTargetForElements({
      element,
      canDrop: ({ source }) =>
        source.data[PAGE_DND] === true || (options.onDropGroup != null && source.data[GROUP_DND] === true),
      getIsSticky: () => true,
      onDragEnter: () => options.setOver(true),
      onDragLeave: () => options.setOver(false),
      onDrop: ({ source }) => {
        options.setOver(false)
        if (source.data[PAGE_DND] === true && typeof source.data.pageId === 'string')
          options.onDropPage(source.data.pageId)
        else if (source.data[GROUP_DND] === true && typeof source.data.groupPath === 'string')
          options.onDropGroup?.(source.data.groupPath)
      },
    })
  })

  onBeforeUnmount(() => {
    cleanup?.()
    cleanup = null
  })
}
