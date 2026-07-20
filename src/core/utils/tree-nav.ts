/**
 * Keyboard-navigation helpers for the page tree. Pure functions over a flat
 * list of visible rows — no Vue, fully unit-testable. The tree UI is
 * virtualised, so navigation works on the flattened row list (see
 * `tree-flatten.ts`) rather than the nested block tree.
 *
 * `id === null` represents the page-level "body" row, which sits above the
 * blocks as their common parent (depth -1). Symbol-edit mode omits it.
 */

/** A navigable tree row. `null` id is the body/page root. */
export interface NavRow {
  id: string | null
  depth: number
  hasChildren: boolean
  expanded: boolean
}

/** Stable DOM id for a tree row, shared by the row and `aria-activedescendant`. */
export function treeRowDomId(id: string | null): string {
  return `uf-tree-${id ?? '__body__'}`
}

function indexOf(rows: NavRow[], id: string | null): number {
  return rows.findIndex(r => r.id === id)
}

/** Next visible row, or `undefined` at the end. */
export function nextRowId(rows: NavRow[], id: string | null): string | null | undefined {
  const i = indexOf(rows, id)
  return i >= 0 && i < rows.length - 1 ? rows[i + 1].id : undefined
}

/** Previous visible row, or `undefined` at the start. */
export function prevRowId(rows: NavRow[], id: string | null): string | null | undefined {
  const i = indexOf(rows, id)
  return i > 0 ? rows[i - 1].id : undefined
}

export function firstRowId(rows: NavRow[]): string | null | undefined {
  return rows.length ? rows[0].id : undefined
}

export function lastRowId(rows: NavRow[]): string | null | undefined {
  return rows.length ? rows[rows.length - 1].id : undefined
}

/** The row's parent (first earlier row at a shallower depth), or `undefined`. */
export function parentRowId(rows: NavRow[], id: string | null): string | null | undefined {
  const i = indexOf(rows, id)
  if (i < 0)
    return undefined
  const { depth } = rows[i]
  for (let j = i - 1; j >= 0; j--) {
    if (rows[j].depth < depth)
      return rows[j].id
  }
  return undefined
}

/** First child of an expanded parent (the next row, one level deeper). */
export function firstChildRowId(rows: NavRow[], id: string | null): string | null | undefined {
  const i = indexOf(rows, id)
  if (i < 0)
    return undefined
  const row = rows[i]
  if (!row.hasChildren || !row.expanded)
    return undefined
  const child = rows[i + 1]
  return child && child.depth > row.depth ? child.id : undefined
}

/** Action a key press resolves to, or `null` when the key isn't handled. */
export type TreeKeyAction
  = | { type: 'select', id: string | null }
    | { type: 'toggle', id: string }
    | { type: 'duplicate', id: string }
    | { type: 'move', direction: -1 | 1 }

/** Minimal subset of `KeyboardEvent` the resolver reads. */
export interface TreeKey {
  key: string
  altKey?: boolean
  metaKey?: boolean
  ctrlKey?: boolean
}

function select(id: string | null | undefined): TreeKeyAction | null {
  return id === undefined ? null : { type: 'select', id }
}

/**
 * Maps a key press (given the current focus) to an editor action. Returns
 * `null` for keys the tree doesn't handle, so callers can leave the default
 * (e.g. Tab) untouched. `current` is the focused/selected row id (`null` =
 * body). Block-only actions (duplicate/move) return `null` on body.
 *
 * Deletion is intentionally absent: the global Delete/Backspace hotkey already
 * removes the selected block, and selection follows focus here, so handling it
 * again would double-fire on the same key press.
 */
export function resolveTreeKey(
  rows: NavRow[],
  current: string | null,
  e: TreeKey,
): TreeKeyAction | null {
  const i = indexOf(rows, current)
  const row = i >= 0 ? rows[i] : undefined
  const mod = e.metaKey || e.ctrlKey

  switch (e.key) {
    case 'ArrowDown':
      return e.altKey ? blockMove(current, 1) : select(nextRowId(rows, current))
    case 'ArrowUp':
      return e.altKey ? blockMove(current, -1) : select(prevRowId(rows, current))
    case 'ArrowRight':
      if (row?.hasChildren && !row.expanded && row.id != null)
        return { type: 'toggle', id: row.id }
      return select(firstChildRowId(rows, current))
    case 'ArrowLeft':
      if (row?.hasChildren && row.expanded && row.id != null)
        return { type: 'toggle', id: row.id }
      return select(parentRowId(rows, current))
    case 'Home':
      return select(firstRowId(rows))
    case 'End':
      return select(lastRowId(rows))
    case 'Enter':
    case ' ':
      return row ? { type: 'select', id: row.id } : null
    case 'd':
    case 'D':
      return mod && current != null ? { type: 'duplicate', id: current } : null
    default:
      return null
  }
}

function blockMove(current: string | null, direction: -1 | 1): TreeKeyAction | null {
  return current != null ? { type: 'move', direction } : null
}
