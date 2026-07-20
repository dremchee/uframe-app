import type { PageBlock } from '@/core/types/page-document'

export interface FlatTreeItem {
  block: PageBlock
  depth: number
  hasChildren: boolean
  expanded: boolean
}

export interface FlattenOptions {
  /** Returns true if a block should reveal its children. Defaults to "all expanded". */
  isExpanded?: (id: string) => boolean
}

/**
 * Walks the block tree depth-first and produces a flat list of visible rows.
 * Children of collapsed blocks are skipped — they don't enter the visible list
 * but are still present in the source tree.
 */
export function flattenTree(blocks: PageBlock[], options: FlattenOptions = {}): FlatTreeItem[] {
  const isExpanded = options.isExpanded ?? (() => true)
  const out: FlatTreeItem[] = []

  function visit(list: PageBlock[], depth: number) {
    for (const block of list) {
      const hasChildren = !!block.children?.length
      const expanded = hasChildren && isExpanded(block.id)
      out.push({ block, depth, hasChildren, expanded })
      if (expanded)
        visit(block.children!, depth + 1)
    }
  }

  visit(blocks, 0)
  return out
}
