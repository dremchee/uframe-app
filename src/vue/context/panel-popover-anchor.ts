import type { InjectionKey, Ref } from 'vue'
import { computed, inject } from 'vue'

/**
 * Lets popovers opened from a docked panel (the settings/variables sidebars)
 * position themselves against the panel's edge rather than the (inset) row that
 * triggered them — so the popover sits flush to the panel border, on the canvas
 * side, instead of overlapping the panel. The hosting panel provides its
 * boundary element and which side it's docked from.
 */
export interface PanelPopoverAnchor {
  /** The panel element whose edge the popover hugs. */
  boundaryEl: Ref<HTMLElement | null>
  /** Which edge to hug + which side the popover opens toward. */
  side: 'left' | 'right'
}

export const PANEL_POPOVER_ANCHOR: InjectionKey<PanelPopoverAnchor> = Symbol('panelPopoverAnchor')

/**
 * A virtual reference (for PopoverContent's `reference`) at the panel edge,
 * vertically aligned to `rowEl`. Width 0 so the popover hugs the edge; `side`
 * decides which edge (left/right) and thus which way it opens.
 */
export function makePanelEdgeReference(
  boundaryEl: Ref<HTMLElement | null>,
  rowEl: Ref<HTMLElement | null>,
  side: 'left' | 'right',
) {
  return {
    getBoundingClientRect: () => {
      const b = boundaryEl.value?.getBoundingClientRect()
      const r = rowEl.value?.getBoundingClientRect()
      const top = r?.top ?? 0
      const height = r?.height ?? 0
      const x = b ? (side === 'right' ? b.right : b.left) : (r?.left ?? 0)
      return { x, y: top, top, bottom: top + height, left: x, right: x, width: 0, height, toJSON: () => ({}) } as DOMRect
    },
  }
}

/**
 * Consume the panel anchor for a popover triggered from `rowEl`. Returns the
 * side to open toward and the virtual reference to hug the panel edge. When no
 * panel provided an anchor, `reference` is undefined (falls back to the trigger).
 */
export function usePanelEdgePopover(rowEl: Ref<HTMLElement | null>) {
  const anchor = inject(PANEL_POPOVER_ANCHOR, null)
  const side = computed(() => anchor?.side ?? 'left')
  const reference = computed(() =>
    anchor ? makePanelEdgeReference(anchor.boundaryEl, rowEl, anchor.side) : undefined,
  )
  return { anchor, side, reference }
}
