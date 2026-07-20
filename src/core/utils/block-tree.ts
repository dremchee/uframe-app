import type { PageBlock } from '@/core/types/page-document'
import { insertListItem, moveListItem } from '@/core/utils/list'

/** Pure recursive map over a block tree. */
export function mapBlockTree(
  blocks: PageBlock[],
  fn: (block: PageBlock) => PageBlock,
): PageBlock[] {
  return blocks.map((block) => {
    const mapped = fn(block)
    if (!mapped.children?.length)
      return mapped
    return { ...mapped, children: mapBlockTree(mapped.children, fn) }
  })
}

/** Visits blocks depth-first; returning false skips a block's descendants. */
export function visitBlockTree(
  blocks: PageBlock[],
  visitor: (block: PageBlock) => boolean | void,
): void {
  for (const block of blocks) {
    const descend = visitor(block)
    if (descend !== false && block.children?.length)
      visitBlockTree(block.children, visitor)
  }
}

export function filterBlockTree(
  blocks: PageBlock[],
  predicate: (block: PageBlock) => boolean,
): PageBlock[] {
  return blocks
    .filter(predicate)
    .map(block => ({
      ...block,
      children: block.children ? filterBlockTree(block.children, predicate) : undefined,
    }))
}

export function findBlock(blocks: PageBlock[], id: string): PageBlock | undefined {
  for (const block of blocks) {
    if (block.id === id)
      return block

    const child = block.children ? findBlock(block.children, id) : undefined
    if (child)
      return child
  }
}

export function updateBlockInTree(
  blocks: PageBlock[],
  id: string,
  updater: (block: PageBlock) => PageBlock,
): PageBlock[] {
  return blocks.map((block) => {
    if (block.id === id)
      return updater(block)

    if (!block.children)
      return block

    return {
      ...block,
      children: updateBlockInTree(block.children, id, updater),
    }
  })
}

export function removeBlockFromTree(blocks: PageBlock[], id: string): PageBlock[] {
  return filterBlockTree(blocks, block => block.id !== id)
}

export function moveBlock(blocks: PageBlock[], id: string, direction: -1 | 1): PageBlock[] {
  const index = blocks.findIndex(block => block.id === id)

  if (index >= 0) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= blocks.length)
      return blocks

    return moveListItem(blocks, index, nextIndex)
  }

  return blocks.map(block => ({
    ...block,
    children: block.children ? moveBlock(block.children, id, direction) : undefined,
  }))
}

export function findBlockParentId(blocks: PageBlock[], id: string, parentId: string | null = null): string | null | undefined {
  for (const block of blocks) {
    if (block.id === id)
      return parentId

    if (block.children) {
      const found = findBlockParentId(block.children, id, block.id)
      if (found !== undefined)
        return found
    }
  }

  return undefined
}

/** Returns the chain of blocks from the root down to (and including) id. */
export function getBlockPath(blocks: PageBlock[], id: string): PageBlock[] {
  function walk(list: PageBlock[], trail: PageBlock[]): PageBlock[] | null {
    for (const block of list) {
      const next = [...trail, block]
      if (block.id === id)
        return next
      if (block.children) {
        const found = walk(block.children, next)
        if (found)
          return found
      }
    }
    return null
  }

  return walk(blocks, []) ?? []
}

export function isDescendantOf(blocks: PageBlock[], ancestorId: string, descendantId: string): boolean {
  const ancestor = findBlock(blocks, ancestorId)
  if (!ancestor?.children?.length)
    return false

  function walk(list: PageBlock[]): boolean {
    for (const block of list) {
      if (block.id === descendantId)
        return true
      if (block.children?.length && walk(block.children))
        return true
    }
    return false
  }

  return walk(ancestor.children)
}

function removeFromList(blocks: PageBlock[], id: string): { next: PageBlock[], removed: PageBlock | null } {
  let removed: PageBlock | null = null
  const next: PageBlock[] = []

  for (const block of blocks) {
    if (block.id === id) {
      removed = block
      continue
    }

    if (block.children?.length) {
      const result = removeFromList(block.children, id)
      if (result.removed) {
        removed = result.removed
        next.push({ ...block, children: result.next })
        continue
      }
    }

    next.push(block)
  }

  return { next, removed }
}

export function insertBlockInTree(
  blocks: PageBlock[],
  parentId: string | null,
  index: number,
  block: PageBlock,
): PageBlock[] {
  if (parentId === null)
    return insertListItem(blocks, index, block)

  if (!findBlock(blocks, parentId))
    return blocks

  return blocks.map((current) => {
    if (current.id === parentId)
      return { ...current, children: insertListItem(current.children, index, block) }

    if (current.children?.length) {
      return {
        ...current,
        children: insertBlockInTree(current.children, parentId, index, block),
      }
    }

    return current
  })
}

export function moveBlockTo(
  blocks: PageBlock[],
  sourceId: string,
  targetParentId: string | null,
  targetIndex: number,
): PageBlock[] {
  if (sourceId === targetParentId)
    return blocks

  if (targetParentId !== null && isDescendantOf(blocks, sourceId, targetParentId))
    return blocks

  const sourceParentId = findBlockParentId(blocks, sourceId)
  if (sourceParentId === undefined)
    return blocks

  const { next, removed } = removeFromList(blocks, sourceId)
  if (!removed)
    return blocks

  let insertionIndex = targetIndex
  if (sourceParentId === targetParentId) {
    const list = targetParentId === null
      ? next
      : (findBlock(next, targetParentId)?.children ?? [])
    if (targetIndex > list.length)
      insertionIndex = list.length
  }

  return insertBlockInTree(next, targetParentId, insertionIndex, removed)
}
