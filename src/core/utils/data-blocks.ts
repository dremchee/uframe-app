import type { BlockDataSource, PageBlock, PageDocument } from '@/core/types/page-document'
import { DATA_ITEM_BLOCK_TYPE, DATA_LIST_BLOCK_TYPE } from '@/core/types/page-document'
import { getBlockPath, visitBlockTree } from '@/core/utils/block-tree'

export interface DataRequirement {
  blockId: string
  kind: 'list' | 'item'
  source: BlockDataSource
}

/** Removes repeated data-list row suffixes from a canvas block id. */
export function baseBlockId(id: string): string {
  return id.replace(/(?:~\d+)+$/, '')
}

/** Returns the nearest enclosing data source collection for a block. */
export function findDataScopeCollection(blocks: PageBlock[], blockId: string): string | null {
  const path = getBlockPath(blocks, blockId)
  for (let i = path.length - 1; i >= 0; i--) {
    const block = path[i]!
    if (
      (block.type === DATA_LIST_BLOCK_TYPE || block.type === DATA_ITEM_BLOCK_TYPE)
      && block.source?.collection
    ) {
      return block.source.collection
    }
  }
  return null
}

/** Lists the data queries an adapter must fetch before resolving a document. */
export function collectDataRequirements(document: PageDocument): DataRequirement[] {
  const out: DataRequirement[] = []

  visitBlockTree(document.blocks, (block) => {
    const isList = block.type === DATA_LIST_BLOCK_TYPE
    const isItem = block.type === DATA_ITEM_BLOCK_TYPE

    if (block.source && (isList || isItem))
      out.push({ blockId: block.id, kind: isList ? 'list' : 'item', source: block.source })

    return isList ? false : undefined
  })
  return out
}
