import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import type { InjectionKey } from 'vue'
import type { PageDocument } from '@/core'
import type { PageEditorInstance } from '@/vue/context/editor-context'

// Shared by PagesPanel and the recursive PageGroupNode so the tree doesn't
// prop-drill handlers through every level.
export interface PagesPanelApi {
  editor: PageEditorInstance
  isCollapsed: (path: string) => boolean
  toggle: (path: string) => void
  pagesIn: (path: string) => PageDocument[]
  /** Rename a group's last segment. */
  rename: (path: string, name: string) => void
  /** Delete a group (its pages and subgroups fall back to ungrouped). */
  remove: (path: string) => void
  /** Add a new page directly into a group. */
  add: (path: string) => void
  /** A page row was dropped onto a group header → move it into the group. */
  dropPage: (path: string, draggedId: string) => void
  /** A group was dropped onto another group header → nest it inside. */
  dropGroup: (parentPath: string, draggedPath: string) => void
  /** A page row was dropped onto another row (reorder, adopting its group). */
  rowDrop: (targetId: string, group: string | undefined, payload: { draggedId: string, edge: Edge | null }) => void
}

export const PAGES_PANEL_KEY: InjectionKey<PagesPanelApi> = Symbol('uframe-pages-panel')
