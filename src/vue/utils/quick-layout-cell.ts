import type { PageBlock } from '@/core'
import { ELEMENT_BLOCK_TYPE } from '@/core'

/** Only discard untouched layout cells; customized blocks belong in Layers. */
export function canRemoveLayoutCell(block: PageBlock | undefined): boolean {
  if (!block || block.type !== ELEMENT_BLOCK_TYPE || block.children?.length)
    return false
  if (Object.entries(block.props).some(([key, value]) => key !== 'tag' || (value != null && value !== 'div')))
    return false
  return !block.name && !block.htmlId && !block.hidden && !block.source && !block.asset
    && !block.classes?.length
    && !Object.keys(block.style ?? {}).length
    && !Object.keys(block.attributes ?? {}).length
    && !Object.keys(block.bindings ?? {}).length
}
