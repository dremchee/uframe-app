import type { BlockDataSource, DataRequirement } from './types'
import type { PageBlock, PageDocument } from '@/core/types/page-document'
import { getBlockPath, visitBlockTree } from '@/core/utils/block-tree'
import { DATA_ITEM_BLOCK_TYPE, DATA_LIST_BLOCK_TYPE } from './types'

/** Returns the nearest collection scope introduced by a Data plugin block. */
export function findDataScopeCollection(blocks: PageBlock[], blockId: string): string | null {
  const path = getBlockPath(blocks, blockId)
  for (let index = path.length - 1; index >= 0; index--) {
    const block = path[index]!
    if ((block.type === DATA_LIST_BLOCK_TYPE || block.type === DATA_ITEM_BLOCK_TYPE) && block.source?.collection)
      return block.source.collection
  }
  return null
}

/** Lists the CMS queries required to render a document with the Data plugin. */
export function collectDataRequirements(document: PageDocument): DataRequirement[] {
  const requirements: DataRequirement[] = []
  visitBlockTree(document.blocks, (block) => {
    const isList = block.type === DATA_LIST_BLOCK_TYPE
    const isItem = block.type === DATA_ITEM_BLOCK_TYPE
    if (block.source && (isList || isItem))
      requirements.push({ blockId: block.id, kind: isList ? 'list' : 'item', source: block.source as BlockDataSource })
    return isList ? false : undefined
  })
  return requirements
}
